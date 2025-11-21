from flask import Blueprint, request, jsonify, current_app
import jwt
from functools import wraps
import firebase_admin
from firebase_admin import firestore

user_bp = Blueprint("user", __name__)

# Initialize Firestore
db = firestore.client()


def token_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        token = None
        if "Authorization" in request.headers:
            token = request.headers["Authorization"].split(" ")[1]

        if not token:
            return jsonify({"error": "Token is missing"}), 401

        try:
            data = jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])
            user_ref = db.collection("users").document(data["username"])
            user_doc = user_ref.get()
            if not user_doc.exists:
                return jsonify({"error": "User not found"}), 404
            current_user = user_doc.to_dict()
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401

        return f(current_user, *args, **kwargs)

    return wrapper


@user_bp.route("/profile", methods=["GET"])
@token_required
def profile(current_user):
    # Return safe user data
    return jsonify({
        "username": current_user.get("username"),
        "email": current_user.get("email")
    })


@user_bp.route("/all", methods=["GET"])
@token_required
def all_users(current_user):
    users_ref = db.collection("users").stream()
    users = [{"username": user.to_dict().get("username")} for user in users_ref]
    return jsonify(users)
