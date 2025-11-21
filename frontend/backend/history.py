from flask import Blueprint, request, jsonify, current_app
from extensions import mongo
import jwt, datetime
from bson import ObjectId

history_bp = Blueprint("history", __name__)

# ---------------- HELPER: Decode JWT ----------------
def get_current_user(token):
    try:
        token = token.split(" ")[1] if " " in token else token
        decoded = jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])
        return decoded["user_id"]
    except:
        return None


# ---------------- SAVE HISTORY ----------------
@history_bp.route("/save", methods=["POST"])
def save_history():
    token = request.headers.get("Authorization")
    user_id = get_current_user(token)

    if not user_id:
        return jsonify({"error": "Invalid or expired token"}), 401

    data = request.get_json()
    history_data = {
        "user_id": ObjectId(user_id),
        "event": data.get("event"),       # ex: "Navigation", "Emergency", etc.
        "details": data.get("details"),   # ex: "Route: A to B"
        "timestamp": datetime.datetime.utcnow()
    }

    mongo.db.history.insert_one(history_data)
    return jsonify({"msg": "History saved successfully"}), 201


# ---------------- GET HISTORY ----------------
@history_bp.route("/list", methods=["GET"])
def list_history():
    token = request.headers.get("Authorization")
    user_id = get_current_user(token)

    if not user_id:
        return jsonify({"error": "Invalid or expired token"}), 401

    records = mongo.db.history.find({"user_id": ObjectId(user_id)}).sort("timestamp", -1)
    history = []
    for r in records:
        history.append({
            "event": r["event"],
            "details": r["details"],
            "timestamp": r["timestamp"].strftime("%Y-%m-%d %H:%M:%S")
        })

    return jsonify(history), 200
