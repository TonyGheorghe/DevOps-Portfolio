#!/usr/bin/env python3
"""
Test script pentru verificarea creării utilizatorilor cu toate rolurile.
Rulează acest script pentru a testa funcționalitatea completă.
"""

import requests
import json
import sys
from datetime import datetime

API_BASE_URL = "http://localhost:8000"

def test_user_creation():
    """Test completă pentru crearea utilizatorilor cu toate rolurile."""
    
    print("🧪 TESTING USER CREATION WITH ALL ROLES")
    print("=" * 60)
    
    # Step 1: Login as admin
    print("\n1. 🔐 Login as admin...")
    try:
        login_response = requests.post(f"{API_BASE_URL}/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.status_code}")
            return False
            
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("✅ Admin login successful!")
        
    except Exception as e:
        print(f"❌ Login error: {e}")
        return False
    
    # Step 2: Test creating users with all roles
    test_users = [
        {
            "username": "test_admin_new",
            "password": "TestAdmin123!",
            "role": "admin",
            "company_name": "",
            "contact_email": "test.admin@arhivare.ro",
            "notes": "Test administrator account"
        },
        {
            "username": "test_audit_new",
            "password": "TestAudit123!",
            "role": "audit",
            "company_name": "",
            "contact_email": "test.audit@arhivare.ro",
            "notes": "Test audit account for reporting"
        },
        {
            "username": "test_client_new",
            "password": "TestClient123!",
            "role": "client",
            "company_name": "Test Company SRL",
            "contact_email": "test.client@testcompany.ro",
            "notes": "Test client account for fond management"
        }
    ]
    
    created_users = []
    
    print("\n2. 👥 Creating test users...")
    for user_data in test_users:
        print(f"\n   Creating {user_data['role']} user: {user_data['username']}")
        
        try:
            create_response = requests.post(
                f"{API_BASE_URL}/users/",
                headers=headers,
                json=user_data
            )
            
            if create_response.status_code == 201:
                created_user = create_response.json()
                created_users.append(created_user)
                print(f"   ✅ Created {user_data['role']}: {created_user['username']}")
                
                # Verify specific fields for client
                if user_data['role'] == 'client':
                    if created_user.get('company_name') == user_data['company_name']:
                        print(f"   ✅ Company name correctly saved: {created_user['company_name']}")
                    else:
                        print(f"   ⚠️  Company name issue: expected {user_data['company_name']}, got {created_user.get('company_name')}")
                        
            else:
                error_detail = create_response.json().get('detail', 'Unknown error')
                print(f"   ❌ Failed to create {user_data['role']}: {error_detail}")
                
        except Exception as e:
            print(f"   ❌ Error creating {user_data['role']}: {e}")
    
    # Step 3: Test authentication for each created user
    print(f"\n3. 🔑 Testing authentication for created users...")
    for user_data in test_users:
        print(f"\n   Testing login for {user_data['username']} ({user_data['role']})...")
        
        try:
            test_login = requests.post(f"{API_BASE_URL}/auth/login", json={
                "username": user_data["username"],
                "password": user_data["password"]
            })
            
            if test_login.status_code == 200:
                user_info = test_login.json()
                print(f"   ✅ Login successful for {user_data['role']}")
                print(f"      Role: {user_info['user']['role']}")
                print(f"      Username: {user_info['user']['username']}")
                
                # Test /auth/me endpoint
                user_token = user_info["access_token"]
                user_headers = {"Authorization": f"Bearer {user_token}"}
                
                me_response = requests.get(f"{API_BASE_URL}/auth/me", headers=user_headers)
                if me_response.status_code == 200:
                    print(f"   ✅ /auth/me endpoint works for {user_data['role']}")
                else:
                    print(f"   ⚠️  /auth/me failed for {user_data['role']}: {me_response.status_code}")
                    
            else:
                print(f"   ❌ Login failed for {user_data['role']}: {test_login.status_code}")
                
        except Exception as e:
            print(f"   ❌ Login test error for {user_data['role']}: {e}")
    
    # Step 4: Test role-specific endpoints
    print(f"\n4. 🎯 Testing role-specific access...")
    
    # Test client access to fonduri
    if any(user['role'] == 'client' for user in test_users):
        client_user = next(user for user in test_users if user['role'] == 'client')
        print(f"\n   Testing client fond access for {client_user['username']}...")
        
        try:
            client_login = requests.post(f"{API_BASE_URL}/auth/login", json={
                "username": client_user["username"],
                "password": client_user["password"]
            })
            
            if client_login.status_code == 200:
                client_token = client_login.json()["access_token"]
                client_headers = {"Authorization": f"Bearer {client_token}"}
                
                # Test accessing my-fonds endpoint
                fonds_response = requests.get(f"{API_BASE_URL}/fonds/my-fonds", headers=client_headers)
                if fonds_response.status_code == 200:
                    fonds_data = fonds_response.json()
                    print(f"   ✅ Client can access my-fonds endpoint: {len(fonds_data)} fonds")
                else:
                    print(f"   ❌ Client my-fonds access failed: {fonds_response.status_code}")
                
                # Test client stats endpoint
                stats_response = requests.get(f"{API_BASE_URL}/fonds/my-fonds/stats", headers=client_headers)
                if stats_response.status_code == 200:
                    print(f"   ✅ Client can access stats endpoint")
                else:
                    print(f"   ❌ Client stats access failed: {stats_response.status_code}")
                    
        except Exception as e:
            print(f"   ❌ Client endpoint test error: {e}")
    
    # Step 5: List all users to verify they appear correctly
    print(f"\n5. 📋 Verifying user list...")
    try:
        users_response = requests.get(f"{API_BASE_URL}/users/", headers=headers)
        if users_response.status_code == 200:
            all_users = users_response.json()
            print(f"   ✅ Total users in system: {len(all_users)}")
            
            # Count by role
            role_counts = {}
            for user in all_users:
                role = user['role']
                role_counts[role] = role_counts.get(role, 0) + 1
            
            print("   📊 User distribution by role:")
            for role, count in role_counts.items():
                print(f"      • {role}: {count}")
                
            # Verify our test users appear with correct data
            print("\n   🔍 Verifying test users in list:")
            for test_user in test_users:
                found_user = next((u for u in all_users if u['username'] == test_user['username']), None)
                if found_user:
                    print(f"      ✅ {test_user['username']} found with role: {found_user['role']}")
                    if test_user['role'] == 'client' and found_user.get('company_name'):
                        print(f"         Company: {found_user['company_name']}")
                else:
                    print(f"      ❌ {test_user['username']} not found in user list")
                    
        else:
            print(f"   ❌ Failed to get user list: {users_response.status_code}")
            
    except Exception as e:
        print(f"   ❌ User list verification error: {e}")
    
    # Step 6: Clean up - delete test users
    print(f"\n6. 🧹 Cleaning up test users...")
    for user_data in test_users:
        print(f"   Deleting {user_data['username']}...")
        
        try:
            # First, find the user ID
            users_response = requests.get(f"{API_BASE_URL}/users/", headers=headers)
            if users_response.status_code == 200:
                all_users = users_response.json()
                test_user = next((u for u in all_users if u['username'] == user_data['username']), None)
                
                if test_user:
                    delete_response = requests.delete(f"{API_BASE_URL}/users/{test_user['id']}", headers=headers)
                    if delete_response.status_code == 204:
                        print(f"   ✅ Deleted {user_data['username']}")
                    else:
                        print(f"   ⚠️  Delete failed for {user_data['username']}: {delete_response.status_code}")
                else:
                    print(f"   ⚠️  {user_data['username']} not found for deletion")
            
        except Exception as e:
            print(f"   ❌ Error deleting {user_data['username']}: {e}")
    
    print("\n" + "="*60)
    print("🎉 USER CREATION TEST COMPLETED!")
    print("\n📋 Summary:")
    print("   • Tested creation of admin, audit, and client users")
    print("   • Verified authentication for all user types")
    print("   • Tested role-specific endpoint access")
    print("   • Verified client company_name field handling")
    print("   • Cleaned up test data")
    print("\n💡 If all tests passed, your user management system is working correctly!")
    
    return True

def test_frontend_roles():
    """Test that frontend can handle all roles correctly."""
    print("\n🎨 FRONTEND ROLE TESTING INSTRUCTIONS")
    print("=" * 60)
    
    print("\n1. 📱 Open the React frontend at http://localhost:3000")
    print("2. 🔐 Login as admin (admin/admin123)")
    print("3. 👥 Go to Users Management page")
    print("4. ➕ Click 'Adaugă Utilizator'")
    print("5. 🔍 Verify the Role dropdown shows:")
    print("   • Administrator")
    print("   • Audit") 
    print("   • Client")
    print("6. 🏢 Select 'Client' and verify 'Numele Companiei' field appears")
    print("7. ✅ Create a test client user and verify it works")
    print("8. 🔑 Logout and test login with the new client account")
    print("9. 📊 Verify client sees only their dashboard and my-fonds")
    
    print("\n✅ Expected Behavior:")
    print("   • Admin can create users with all 3 roles")
    print("   • Client role requires company name")
    print("   • Client users can only see their own fonds")
    print("   • Audit users have read-only access")

if __name__ == "__main__":
    print("🚀 ARHIVARE WEB APP - USER ROLE TESTING")
    print("=" * 60)
    
    # Check if backend is running
    try:
        health_response = requests.get(f"{API_BASE_URL}/health")
        if health_response.status_code != 200:
            print("❌ Backend is not running or not healthy!")
            print("💡 Start the backend with: uvicorn app.main:app --reload")
            sys.exit(1)
        else:
            print("✅ Backend is running and healthy!")
            
    except Exception as e:
        print(f"❌ Cannot connect to backend: {e}")
        print("💡 Make sure the backend is running on http://localhost:8000")
        sys.exit(1)
    
    # Run the actual tests
    success = test_user_creation()
    
    if success:
        print("\n" + "="*60)
        test_frontend_roles()
        print("\n🎯 NEXT STEPS:")
        print("1. Test the frontend user creation interface")
        print("2. Verify client login and fond management")
        print("3. Test role-based access control")
        print("4. Create some real client users for your application")
    else:
        print("\n❌ Tests failed! Check the errors above and fix them.")
        sys.exit(1)
