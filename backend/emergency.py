from flask import Blueprint, request, jsonify, current_app
import jwt, datetime
import firebase_admin
from firebase_admin import credentials, firestore, messaging
from functools import wraps

emergency_bp = Blueprint("emergency", __name__)

# ---------------- Firebase Init ----------------
if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()


# ---------------- JWT Helper ----------------
def token_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        token = request.headers.get("Authorization")
        if not token:
            return jsonify({"error": "Token is missing"}), 401
        try:
            token = token.split(" ")[1] if " " in token else token
            decoded = jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])
            user_id = decoded["user_id"]
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
        return f(user_id, *args, **kwargs)
    return wrapper


# ---------------- Firebase Messaging ----------------
def send_emergency_notification(title, body):
    try:
        message = messaging.Message(
            notification=messaging.Notification(title=title, body=body),
            topic="VoixMateAlerts"
        )
        response = messaging.send(message)
        print("Notification sent:", response)
    except Exception as e:
        print("Notification failed:", e)


# ---------------- SAVE EMERGENCY ----------------
@emergency_bp.route("/save", methods=["POST"])
@token_required
def save_emergency(user_id):
    data = request.get_json()
    emergency_ref = db.collection("emergencies").document()
    emergency_ref.set({
        "user_id": user_id,
        "type": data.get("type"),
        "location": data.get("location"),
        "timestamp": datetime.datetime.utcnow()
    })

    send_emergency_notification(
        title="Emergency Alert!",
        body=f"{data.get('type')} at {data.get('location')}"
    )

    return jsonify({"msg": "Emergency saved & notification sent", "id": emergency_ref.id}), 201


# ---------------- LIST EMERGENCIES ----------------
@emergency_bp.route("/list", methods=["GET"])
@token_required
def list_emergency(user_id):
    records = db.collection("emergencies") \
        .where("user_id", "==", user_id) \
        .order_by("timestamp", direction=firestore.Query.DESCENDING) \
        .stream()

    emergencies = [{
        "id": r.id,
        "type": r.to_dict()["type"],
        "location": r.to_dict()["location"],
        "timestamp": r.to_dict()["timestamp"].strftime("%Y-%m-%d %H:%M:%S")
    } for r in records]

    return jsonify(emergencies), 200


# ---------------- DELETE EMERGENCY ----------------
@emergency_bp.route("/delete/<id>", methods=["DELETE"])
@token_required
def delete_emergency(user_id, id):
    emergency_ref = db.collection("emergencies").document(id)
    emergency_doc = emergency_ref.get()

    if not emergency_doc.exists or emergency_doc.to_dict()["user_id"] != user_id:
        return jsonify({"error": "Not found"}), 404

    emergency_ref.delete()
    return jsonify({"msg": "Emergency deleted"}), 200
