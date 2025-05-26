from app.database import engine, Base
from sqlalchemy import text

def reset_database():
    # Drop all tables
    Base.metadata.drop_all(bind=engine)
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    print("Database has been reset successfully!")

if __name__ == "__main__":
    reset_database() 