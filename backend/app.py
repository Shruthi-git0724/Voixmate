from flask import Flask
from routes.auth import auth_bp
from routes.user import user_bp
from history import history_bp
from emergency import emergency_bp
import os

import firebase_admin
from firebase_admin import credentials, firestore

app = Flask(__name__)

# ---------------- Config ----------------
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "your_secret_key")

# ---------------- Firebase Init ----------------
cred = credentials.Certificate(os.getenv("FIREBASE_KEY_PATH"))
firebase_admin.initialize_app(cred)

# Firestore client (can be imported in blueprints)
db = firestore.client()

# ---------------- Register Blueprints ----------------
app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(user_bp, url_prefix="/user")
app.register_blueprint(history_bp, url_prefix="/history")
app.register_blueprint(emergency_bp, url_prefix="/emergency")

# ---------------- Run App ----------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
