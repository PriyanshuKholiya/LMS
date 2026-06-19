import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine
from app.models.base import Base

# Import models to register them on the metadata
from app.models import user, course, assignment, quiz, attendance, notification, ai_tutor

def init_database():
    print("Connecting to database and creating tables...")
    try:
        Base.metadata.create_all(bind=engine)
        print("Success! All database tables created successfully.")
    except Exception as e:
        print(f"Error creating database tables: {e}", file=sys.stderr)
        print("\nPlease check that your PostgreSQL database is running and the DATABASE_URL in your .env file is correct.", file=sys.stderr)

if __name__ == "__main__":
    init_database()
