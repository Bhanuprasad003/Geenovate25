# backend/db/mongo.py
from pymongo import MongoClient
import os
from dotenv import load_dotenv
import logging
from datetime import datetime

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MongoDB:
    def __init__(self):
        self.client = None
        self.db = None
        self.connect()
    
    def connect(self):
        """Establish connection to MongoDB"""
        try:
            mongo_uri = os.getenv("MONGO_URI")
            if not mongo_uri:
                raise ValueError("MONGO_URI not found in environment variables")
            
            self.client = MongoClient(mongo_uri)
            self.db = self.client.insurance_assistant
            logger.info("MongoDB connection established successfully")
            
            # Create indexes for better performance
            self.db.users.create_index("email", unique=True)
            self.db.chat_history.create_index("user_id")
        
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise
    
    def close(self):
        """Close the MongoDB connection"""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")
    
    # User management methods
    def create_user(self, email, password_hash, name):
        """Create a new user in the database"""
        try:
            result = self.db.users.insert_one({
                "email": email,
                "password": password_hash,
                "name": name,
                "created_at": datetime.utcnow(),
                "last_login": datetime.utcnow()
            })
            logger.info(f"Created user with ID: {result.inserted_id}")
            return result.inserted_id
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            raise
    
    def get_user_by_email(self, email):
        """Retrieve a user by email"""
        return self.db.users.find_one({"email": email})
    
    def get_user_by_id(self, user_id):
        """Retrieve a user by ID"""
        from bson.objectid import ObjectId
        return self.db.users.find_one({"_id": ObjectId(user_id)})
    
    def update_last_login(self, user_id):
        """Update the last login timestamp for a user"""
        from bson.objectid import ObjectId
        self.db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"last_login": datetime.utcnow()}}
        )
    
    # Chat history methods
    def save_chat_message(self, user_id, message, is_bot=False):
        """Save a chat message to the database"""
        chat_entry = {
            "user_id": user_id,
            "message": message,
            "is_bot": is_bot,
            "timestamp": datetime.utcnow()
        }
        return self.db.chat_history.insert_one(chat_entry).inserted_id
    
    def get_chat_history(self, user_id, limit=50):
        """Get chat history for a user"""
        from bson.objectid import ObjectId
        return list(self.db.chat_history.find(
            {"user_id": ObjectId(user_id)}
        ).sort("timestamp", 1).limit(limit))

# Create a MongoDB instance to be imported by other modules
db = MongoDB()