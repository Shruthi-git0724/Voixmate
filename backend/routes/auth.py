from flask import Blueprint, request, jsonify, current_app
import jwt, datetime
from firebase_admin import firestore

auth_bp = Blueprint("auth", __name__)
db = firestore.client()

# ---------------- JWT Helper ----------------
def create_token(user_id):
    payload = {
        "user_id": user_id,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=12)
    }
    return jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")


def decode_token(token):
    try:
        decoded = jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])
        return decoded["user_id"]
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


# ---------------- Routes ----------------

# Register new user
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.json
    user_id = data.get("user_id")
    email = data.get("email")

    if not user_id or not email:
        return jsonify({"error": "user_id and email required"}), 400

    # Save user in Firestore
    db.collection("users").document(user_id).set({
        "email": email,
        "created_at": datetime.datetime.utcnow()
    })

    return jsonify({"message": "User registered successfully"})


# Login (returns JWT)
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    user_id = data.get("user_id")

    if not user_id:
        return jsonify({"error": "user_id required"}), 400

    doc = db.collection("users").document(user_id).get()
    if not doc.exists:
        return jsonify({"error": "User not found"}), 404

    token = create_token(user_id)
    return jsonify({"token": token})
