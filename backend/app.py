from flask import Flask, jsonify, request
from flask_cors import CORS
import bcrypt
import jwt
import datetime
import uuid  # Import the uuid module
from functools import wraps
import mongoengine as me
from mongoengine import Document, StringField, IntField, DateTimeField, connect, disconnect_all, DoesNotExist

app = Flask(__name__)

# Configure CORS properly to accept requests from your React app
CORS(app, resources={r"/*": {"origins": "http://localhost:5173", "supports_credentials": True}})

# Configure MongoDB - Make sure this is set before initializing PyMongo
mongo_uri = "mongodb+srv://bossutkarsh30:YOCczedaElKny6Dd@cluster0.gixba.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

# Connect to MongoDB using MongoEngine
me.connect(db="alzheimers_db", host=mongo_uri)

# Define Document Models
class Patient(Document):
    user_id = StringField(primary_key=True, default=lambda: str(uuid.uuid4()))  # Simple unique ID
    name = StringField(required=True)
    email = StringField(required=True, unique=True)
    password = StringField(required=True)
    age = IntField(required=True)
    date = DateTimeField(default=datetime.datetime.now)

    meta = {'collection': 'patient'}

    def to_json(self):
        return {
            '_id': self.user_id,  # Use user_id as the ID
            'name': self.name,
            'email': self.email,
            'age': self.age,
            'date': self.date
        }

# Define KnownPerson model
class KnownPerson(Document):
    patient_id = StringField()
    name = StringField()
    relationship = StringField()
    # Add other fields as needed
    
    meta = {'collection': 'known_person'}

# Add a route to test MongoDB connection
@app.route('/api/test', methods=['GET'])
def test_db():
    try:
        # Check if we can access the database
        db_names = connect(host=mongo_uri).database_names()
        return jsonify({
            'status': 'success',
            'message': 'MongoDB connection successful',
            'databases': db_names
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'MongoDB connection failed: {str(e)}'
        }), 500

# JWT token verification middleware
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('x-auth-token')

        if not token:
            return jsonify({'message': 'No token, authorization denied'}), 401

        try:
            data = jwt.decode(token, "patientSecretKey123", algorithms=["HS256"])
            current_user_id = data['user']['id']
        except:
            return jsonify({'message': 'Token is not valid'}), 401

        return f(current_user_id, *args, **kwargs)

    return decorated

# Basic route for testing
@app.route('/', methods=['GET'])
def home():
    return "API Running"

# Register route
@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        # Log that we received a request
        print("Register endpoint hit with data:", request.get_json())

        data = request.get_json()

        # Validate required fields
        required_fields = ['name', 'email', 'password', 'age']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'message': f'Missing required field: {field}'}), 400

        # Check if user exists
        try:
            existing_user = Patient.objects(email=data['email']).first()
            if existing_user:
                return jsonify({'message': 'User already exists with this email'}), 400
        except Exception as e:
            print(f"Error checking existing user: {str(e)}")
            return jsonify({'message': f'Database error: {str(e)}'}), 500

        # Hash the password
        hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())

        # Create new user
        try:
            new_user = Patient(
                name=data['name'],
                email=data['email'],
                password=hashed_password.decode('utf-8'),
                age=data['age']
            )
            new_user.save()
            print(f"User created with ID: {new_user.user_id}")  # Print the UUID
        except Exception as e:
            print(f"Error creating user: {str(e)}")
            return jsonify({'message': f'Database error: {str(e)}'}), 500

        # Create payload for JWT
        payload = {
            'user': {
                'id': str(new_user.user_id)  # Use user_id in JWT
            },
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }

        # Generate token
        token = jwt.encode(payload, "patientSecretKey123", algorithm="HS256")

        # Return user data and token
        return jsonify({
            'token': token,
            'user': new_user.to_json()
        }), 201

    except Exception as e:
        import traceback
        print(f"Registration error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'message': f'Server error: {str(e)}'}), 500

# Login route
@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()

        # Find user by email
        try:
            user = Patient.objects(email=data['email']).first()
            if not user:
                return jsonify({'message': 'Invalid credentials'}), 400
        except Exception as e:
            print(f"Error finding user: {str(e)}")
            return jsonify({'message': f'Database error: {str(e)}'}), 500

        # Check password
        if not bcrypt.checkpw(data['password'].encode('utf-8'), user.password.encode('utf-8')):
            return jsonify({'message': 'Invalid credentials'}), 400

        # Create payload for JWT
        payload = {
            'user': {
                'id': str(user.user_id) #Use user_id in JWT
            },
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }

        # Generate token
        token = jwt.encode(payload, "patientSecretKey123", algorithm="HS256")

        # Return user data and token
        return jsonify({
            'token': token,
            'user': user.to_json()
        })
    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({'message': f'Server error: {str(e)}'}), 500

# Get user route
@app.route('/api/auth/user', methods=['GET'])
@token_required
def get_user(current_user_id):
    try:
        # Find user by id
        try:
            user = Patient.objects(user_id=current_user_id).first()
            if not user:
                return jsonify({'message': 'User not found'}), 404
        except DoesNotExist:
            return jsonify({'message': 'User not found'}), 404
        except Exception as e:
            print(f"Error finding user: {str(e)}")
            return jsonify({'message': f'Database error: {str(e)}'}), 500

        # Return user data
        return jsonify(user.to_json())
    except Exception as e:
        print(f"Get user error: {str(e)}")
        return jsonify({'message': f'Server error: {str(e)}'}), 500
    
@app.route('/api/update-known-persons', methods=['POST'])
def update_known_persons():
    try:
        data = request.get_json()
        user_id = data['userId']
        
        if not user_id:
            return jsonify({'message': 'User ID is required'}), 400
            
        # Log the received user_id for debugging
        print(f"Updating known persons for user ID: {user_id}")
        
        # Check if any known persons exist before updating
        known_persons_count = KnownPerson.objects.count()
        if known_persons_count == 0:
            return jsonify({'message': 'No known persons records found to update'}), 404
            
        # Update patient_id in known_person collection
        KnownPerson.objects.update(patient_id=user_id)
        
        # Check if update was successful
        return jsonify({
            'message': 'Known persons updated successfully',
            'count': known_persons_count
        }), 200
    except Exception as e:
        # Log the full error for debugging
        import traceback
        print(f"Error in update_known_persons: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'message': f'Error updating known persons: {str(e)}'}), 500

if __name__ == '__main__':
    port = 5000
    app.run(debug=True, host='0.0.0.0', port=port)