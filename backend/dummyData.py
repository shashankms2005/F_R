from pymongo import MongoClient
import datetime

# MongoDB connection string
mongo_uri = "mongodb+srv://bossutkarsh30:YOCczedaElKny6Dd@cluster0.gixba.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

# Connect to MongoDB
client = MongoClient(mongo_uri)
db = client["alzheimers_db"]
conversation_collection = db["conversation"]

# The conversation data directly as an object
conversation_data = [
    {
        "text": "Good morning, Sarah. I've been reviewing the quarterly performance metrics for our enterprise division, and I wanted to discuss some of the remarkable trends we're seeing. The data suggests we've exceeded our targets significantly, especially in the new markets we entered last quarter. I'm particularly interested in understanding what specific strategies contributed to this success so we can potentially replicate them across other divisions.",
        "speaker": "app_user",
        "timestamp": "2025-03-20T09:30:00.000000"
    },
    {
        "text": "Good morning, Michael. I've prepared a comprehensive analysis of our Q1 performance. The enterprise division has indeed shown exceptional growth with revenue reaching $2.4 million, representing a 15% increase over our projected targets and a 22% year-over-year improvement compared to Q1 last year. Several factors contributed to this success, including the strategic partnerships we established with key industry players, the enhanced feature set we rolled out in our enterprise solution, and the targeted marketing campaign that generated a 40% increase in qualified leads. I've included a breakdown of performance by market segment and product line in the report I'll be sharing after our discussion.",
        "speaker": "app_user",
        "timestamp": "2025-03-20T09:30:15.000000"
    },
    {
        "text": "That's impressive.",
        "speaker": "app_user",
        "timestamp": "2025-03-20T09:31:50.000000"
    },
    {
        "text": "Thank you, Michael. The team really came together this quarter to make it happen. I've been analyzing which strategies had the biggest impact, and I believe our new customer-centric approach to product development was key. By involving enterprise clients earlier in the development cycle, we addressed pain points more effectively than our competitors. Would you like me to prepare a presentation on these successful strategies for the executive meeting next week? We could showcase how these approaches might benefit other divisions as well.",
        "speaker": "app_user",
        "timestamp": "2025-03-21T10:15:00.000000"
    }
]

# Create the document to insert
conversation_document = {
    "patient_id": "2b21eca3-e66e-4c4c-b539-d1be28726152",
    "known_person_id": "NewPerson_20250321_143702",
    "conversation": conversation_data,
    "last_updated": datetime.datetime.now()
}

# Check if a conversation already exists for this patient and known person
existing_conversation = conversation_collection.find_one({
    "patient_id": conversation_document["patient_id"],
    "known_person_id": conversation_document["known_person_id"]
})

if existing_conversation:
    # Update existing conversation
    result = conversation_collection.update_one(
        {
            "patient_id": conversation_document["patient_id"],
            "known_person_id": conversation_document["known_person_id"]
        },
        {"$set": conversation_document}
    )
    print(f"Updated existing conversation: {result.modified_count} document modified")
else:
    # Insert new conversation
    result = conversation_collection.insert_one(conversation_document)
    print(f"Inserted new conversation with ID: {result.inserted_id}")

# Print confirmation
print(f"Conversation data for patient {conversation_document['patient_id']} and known person {conversation_document['known_person_id']} has been added to the database.")

# Close the connection
client.close()