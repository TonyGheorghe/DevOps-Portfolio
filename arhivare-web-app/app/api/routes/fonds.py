# app/api/routes/fonds.py
@router.get("/", response_model=List[FondResponse])
@router.get("/{fond_id}", response_model=FondResponse)
@router.post("/", response_model=FondResponse)
@router.put("/{fond_id}", response_model=FondResponse)
@router.delete("/{fond_id}")
