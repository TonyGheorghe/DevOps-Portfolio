# app/crud/fond.py
def get_fond(db: Session, fond_id: int) -> Optional[Fond]:
def get_fonds(db: Session, skip: int = 0, limit: int = 100, active_only: bool = True) -> List[Fond]:
def search_fonds(db: Session, search_term: str, skip: int = 0, limit: int = 100) -> List[Fond]:
def create_fond(db: Session, fond: FondCreate) -> Fond:
def update_fond(db: Session, fond_id: int, fond_update: FondUpdate) -> Optional[Fond]:
def soft_delete_fond(db: Session, fond_id: int) -> bool:
