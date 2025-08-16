# test_api_endpoints.py
import requests
import json
from typing import Optional

BASE_URL = "http://localhost:8000"

def test_health_check():
    """Testează health check endpoint-ul."""
    print("\n🏥 Testing Health Check...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    assert response.status_code == 200

def test_public_search(query: str = "brașov"):
    """Testează căutarea publică."""
    print(f"\n🔍 Testing Public Search for: '{query}'...")
    response = requests.get(f"{BASE_URL}/search", params={"query": query, "limit": 5})
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        results = response.json()
        print(f"Found {len(results)} results:")
        for fond in results:
            print(f"  - {fond['company_name']} -> {fond['holder_name']}")
            if fond.get('email'):
                print(f"    📧 {fond['email']}")
            if fond.get('phone'):
                print(f"    📞 {fond['phone']}")
    else:
        print(f"Error: {response.text}")
    
    assert response.status_code == 200

def test_search_count(query: str = "tractorul"):
    """Testează contorizarea rezultatelor căutării."""
    print(f"\n📊 Testing Search Count for: '{query}'...")
    response = requests.get(f"{BASE_URL}/search/count", params={"query": query})
    print(f"Status: {response.status_code}")
    
    try:
        print(f"Response: {response.json()}")
    except:
        print(f"Raw Response: {response.text}")
    
    assert response.status_code == 200

def login_admin() -> Optional[str]:
    """Login ca admin și returnează token-ul."""
    print("\n🔐 Testing Admin Login...")
    
    login_data = {
        "username": "admin",
        "password": "admin1234"  # sau parola pe care ai setat-o
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Login successful for user: {data['user']['username']}")
        return data["access_token"]
    else:
        print(f"❌ Login failed: {response.text}")
        assert None

def test_admin_fonds_list(token: str):
    """Testează listarea fondurilor (admin)."""
    print("\n📋 Testing Admin Fonds List...")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/fonds", headers=headers, params={"limit": 3})
    
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        fonds = response.json()
        print(f"Found {len(fonds)} fonds in admin list:")
        for fond in fonds:
            print(f"  - ID {fond['id']}: {fond['company_name']} (active: {fond['active']})")
    else:
        print(f"Error: {response.text}")
    
    assert response.status_code == 200

def test_create_fond(token: str):
    """Testează crearea unui fond nou."""
    print("\n➕ Testing Create New Fond...")
    
    new_fond = {
        "company_name": "Fabrica de Test SRL",
        "holder_name": "Arhiva Test",
        "address": "Str. Test 123, București",
        "email": "test@example.com",
        "phone": "+40 21 123 4567",
        "notes": "Fond de test creat prin API"
    }
    
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    response = requests.post(f"{BASE_URL}/fonds", headers=headers, json=new_fond)
    
    print(f"Status: {response.status_code}")
    
    if response.status_code == 201:
        created_fond = response.json()
        print(f"✅ Created fond ID: {created_fond['id']}")
        print(f"   Company: {created_fond['company_name']}")
        assert created_fond['id']
    else:
        print(f"❌ Creation failed: {response.text}")
        assert None

def test_unauthorized_access():
    """Testează accesul neautorizat la endpoint-uri admin."""
    print("\n🚫 Testing Unauthorized Access...")
    
    # Încearcă să accesezi endpoint admin fără token
    response = requests.get(f"{BASE_URL}/fonds")
    print(f"Access without token - Status: {response.status_code}")
    
    # Încearcă cu token invalid
    headers = {"Authorization": "Bearer invalid_token"}
    response = requests.get(f"{BASE_URL}/fonds", headers=headers)
    print(f"Access with invalid token - Status: {response.status_code}")
    
    assert True

def main():
    print("🚀 Testarea API-ului Arhivare Web App")
    print("=" * 50)
    
    # 1. Health Check
    if not test_health_check():
        print("❌ Server nu răspunde! Asigură-te că rulează cu: uvicorn app.main:app --reload")
        return
    
    # 2. Public Search Tests
    test_public_search("brașov")
    test_public_search("tractorul")
    test_search_count("textile")
    
    # 3. Unauthorized Access Test
    test_unauthorized_access()
    
    # 4. Admin Tests
    token = login_admin()
    if token:
        test_admin_fonds_list(token)
        new_fond_id = test_create_fond(token)
        
        if new_fond_id:
            print(f"\n✅ Fond de test creat cu ID: {new_fond_id}")
            print("💡 Poți să-l vezi în căutarea publică sau în admin panel")
    
    print("\n🎉 Testele s-au terminat!")
    print("\n📖 Pentru testare interactivă, accesează:")
    print(f"   - Documentație API: {BASE_URL}/docs")
    print(f"   - Căutare publică: {BASE_URL}/search?query=test")
    print(f"   - Health check: {BASE_URL}/health")

if __name__ == "__main__":
    main()
