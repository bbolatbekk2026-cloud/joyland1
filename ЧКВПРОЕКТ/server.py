from flask import Flask, request, jsonify, send_from_directory, redirect, url_for
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, current_user, login_required
from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView
from pathlib import Path
from datetime import datetime
from markupsafe import Markup
import uuid
import json
import os
from google import genai

gemini_client = genai.Client(api_key="AIzaSyB4N_RgV7kxIJf2Sul8HKypGZkPZlAVhMU")



# =========================
# PATHS / FILES
# =========================
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
UPLOADS_DIR = DATA_DIR / "uploads"
CHATBOT_HISTORY_FILE = DATA_DIR / "chatbot_history.json"
CHATBOT_USERS_FILE = DATA_DIR / "chatbot_users.json"
CHATBOT_KNOWLEDGE_FILE = DATA_DIR / "chatbot_knowledge.json"

DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

for file_path, default_data in [
    (CHATBOT_HISTORY_FILE, []),
    (CHATBOT_USERS_FILE, []),
]:
    if not file_path.exists():
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(default_data, f, ensure_ascii=False, indent=2)

if not CHATBOT_KNOWLEDGE_FILE.exists():
    with open(CHATBOT_KNOWLEDGE_FILE, "w", encoding="utf-8") as f:
        json.dump({
            "сәлем": "Сәлем! JoyLand-қа қош келдіңіз. Мен сізге көмектесемін.",
            "бағалар": "Бізде Стандарт, Отбасылық және Туған күн пакеттері бар. Бағалар бетін ашып көріңіз.",
            "қызметтер": "JoyLand-та ойын аймақтары, аниматор, туған күн ұйымдастыру, ата-ана аймағы бар.",
            "брондау": "Брондау үшін Брондау бетіне өтіп, форманы толтырыңыз.",
            "мекенжай": "Біздің мекенжай: Алматы қ., Grand Park.",
            "адрес": "Біздің мекенжай: Алматы қ., Grand Park.",
            "телефон": "Байланыс телефоны: +7 (705) 484-50-46.",
            "уақыт": "JoyLand күн сайын 10:00-ден 21:00-ге дейін жұмыс істейді.",
            "жұмыс уақыты": "JoyLand күн сайын 10:00-ден 21:00-ге дейін жұмыс істейді.",
            "галерея": "Галерея бөлімінде ойын аймақтарының фотолары мен видеолары бар.",
            "туған күн": "Біз туған күн пакеттерін ұйымдастырамыз: зал, декор, музыка, фотоаймақ.",
            "қауіпсіздік": "JoyLand-та жұмсақ жабын, бақылау және қауіпсіздік ережелері қарастырылған."
        }, f, ensure_ascii=False, indent=2)


def load_json_file(path, default):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default


def save_json_file(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def get_chatbot_response(user_text):
    text = (user_text or "").strip().lower()
    knowledge = load_json_file(CHATBOT_KNOWLEDGE_FILE, {})

    for key, value in knowledge.items():
        if key in text:
            return value

    return "Кешіріңіз, мен бұл сұраққа жауап бере алмаймын."


# =========================
# APP CONFIG
# =========================
app = Flask(__name__, static_folder=".", static_url_path="")
app.config["SECRET_KEY"] = "joyland-secret-key"
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///app.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

CORS(app, origins=["http://127.0.0.1:5000"], supports_credentials=True)

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = "auth_page"

admin = Admin(app, name="JoyLand Admin")


# =========================
# MODELS
# =========================
class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(120), unique=True, nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    bio = db.Column(db.Text, default="")
    avatar = db.Column(db.String(255), default="default-avatar.webp")
    is_admin = db.Column(db.Boolean, default=False)

    reviews = db.relationship("Review", backref="user", lazy=True)
    bookings = db.relationship("Booking", backref="user", lazy=True)

    def __repr__(self):
        return f"<User {self.username}>"


class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.Text, nullable=False)
    stars = db.Column(db.Integer, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)

    def __repr__(self):
        return f"<Review {self.id}>"


class Booking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(150), nullable=False)
    phone = db.Column(db.String(50), nullable=False)
    booking_date = db.Column(db.String(50), nullable=False)
    booking_time = db.Column(db.String(50), nullable=False)
    guests = db.Column(db.Integer, default=1)
    package_name = db.Column(db.String(100), default="Стандарт")
    payment_type = db.Column(db.String(100), default="Қолма-қол")
    note = db.Column(db.Text, default="")
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)

    def __repr__(self):
        return f"<Booking {self.id}>"


# =========================
# ADMIN ACCESS
# =========================
class SecureModelView(ModelView):
    can_view_details = True
    can_export = True
    page_size = 20

    def is_accessible(self):
        return current_user.is_authenticated and getattr(current_user, "is_admin", False)

    def inaccessible_callback(self, name, **kwargs):
        return redirect(url_for("auth_page"))


class UserAdminView(SecureModelView):
    column_list = ("id", "username", "email", "bio", "avatar_preview", "is_admin")
    column_searchable_list = ("username", "email")
    column_filters = ("is_admin",)
    column_sortable_list = ("id", "username", "email", "is_admin")
    form_columns = ("username", "email", "password", "bio", "avatar", "is_admin")

    column_labels = {
        "id": "ID",
        "username": "Пайдаланушы аты",
        "email": "Email",
        "password": "Құпиясөз",
        "bio": "Өзі туралы",
        "avatar": "Аватар",
        "is_admin": "Әкімші",
        "avatar_preview": "Фото"
    }

    def _avatar_preview(view, context, model, name):
        if not model.avatar:
            return "-"
        if model.avatar == "default-avatar.webp":
            return Markup('<img src="/default-avatar.webp" width="50" style="border-radius:8px;">')
        return Markup(f'<img src="/uploads/{model.avatar}" width="50" style="border-radius:8px;">')

    column_formatters = {
        "avatar_preview": _avatar_preview
    }


class ReviewAdminView(SecureModelView):
    column_list = ("id", "user", "stars", "text")
    column_searchable_list = ("text",)
    column_filters = ("stars",)
    column_sortable_list = ("id", "stars")
    form_columns = ("user", "stars", "text")

    column_labels = {
        "id": "ID",
        "user": "Пайдаланушы",
        "stars": "Баға",
        "text": "Пікір"
    }


class BookingAdminView(SecureModelView):
    column_list = ("id", "full_name", "phone", "booking_date", "booking_time", "guests", "package_name", "payment_type")
    column_searchable_list = ("full_name", "phone", "package_name")
    column_filters = ("package_name", "payment_type", "booking_date")
    column_sortable_list = ("id", "booking_date", "guests")
    form_columns = ("full_name", "phone", "booking_date", "booking_time", "guests", "package_name", "payment_type", "note", "user")

    column_labels = {
        "id": "ID",
        "full_name": "Аты-жөні",
        "phone": "Телефон",
        "booking_date": "Күні",
        "booking_time": "Уақыты",
        "guests": "Қонақ саны",
        "package_name": "Пакет",
        "payment_type": "Төлем түрі",
        "note": "Түсініктеме",
        "user": "Пайдаланушы"
    }


admin.add_view(UserAdminView(User, db.session, name="Users"))
admin.add_view(ReviewAdminView(Review, db.session, name="Reviews"))
admin.add_view(BookingAdminView(Booking, db.session, name="Bookings"))


# =========================
# LOGIN MANAGER
# =========================
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


# =========================
# STATIC PAGES
# =========================
@app.route("/")
def root():
    return send_from_directory(".", "index.html")


@app.route("/index1.html")
def auth_page():
    return send_from_directory(".", "index1.html")


@app.route("/profile.html")
def profile_page():
    return send_from_directory(".", "profile.html")


@app.route("/booking.html")
def booking_page():
    return send_from_directory(".", "booking.html")


@app.route("/services.html")
def services_page():
    return send_from_directory(".", "services.html")


@app.route("/prices.html")
def prices_page():
    return send_from_directory(".", "prices.html")


@app.route("/gallery.html")
def gallery_page():
    return send_from_directory(".", "gallery.html")


@app.route("/games.html")
def games_page():
    return send_from_directory(".", "games.html")


@app.route("/reviews.html")
def reviews_page():
    return send_from_directory(".", "reviews.html")


@app.route("/contacts.html")
def contacts_page():
    return send_from_directory(".", "contacts.html")


@app.route("/uploads/<path:filename>")
def uploaded_file(filename):
    return send_from_directory(UPLOADS_DIR, filename)


@app.route("/default-avatar.webp")
def default_avatar():
    return send_from_directory(".", "default-avatar.webp")


# =========================
# API
# =========================
@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json(force=True)

    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = (data.get("password") or "").strip()

    if not username or not email or not password:
        return jsonify({"ok": False, "message": "Барлық өрістерді толтырыңыз"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"ok": False, "message": "Бұл username бос емес"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"ok": False, "message": "Бұл email бұрын тіркелген"}), 400

    user = User(
        username=username,
        email=email,
        password=password,
        bio="",
        avatar="default-avatar.webp",
        is_admin=False
    )
    db.session.add(user)
    db.session.commit()

    login_user(user)

    return jsonify({
        "ok": True,
        "message": "Тіркелу сәтті аяқталды",
        "user": {
            "username": user.username,
            "email": user.email,
            "bio": user.bio,
            "avatar": user.avatar
        }
    })


@app.route("/api/login", methods=["POST"])
def login_api():
    data = request.get_json(force=True)

    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()

    user = User.query.filter(
        ((User.username == username) | (User.email == username)) &
        (User.password == password)
    ).first()

    if not user:
        return jsonify({"ok": False, "message": "Пайдаланушы аты немесе құпиясөз қате"}), 401

    login_user(user)

    return jsonify({
        "ok": True,
        "message": "Кіру сәтті",
        "user": {
            "username": user.username,
            "email": user.email,
            "bio": user.bio,
            "avatar": user.avatar
        }
    })


@app.route("/api/logout", methods=["POST"])
@login_required
def logout_api():
    logout_user()
    return jsonify({"ok": True})


@app.route("/api/me", methods=["GET"])
def me():
    if not current_user.is_authenticated:
        return jsonify({"ok": False, "message": "Пайдаланушы кірмеген"}), 401

    return jsonify({
        "ok": True,
        "user": {
            "username": current_user.username,
            "email": current_user.email,
            "bio": current_user.bio,
            "avatar": current_user.avatar,
            "is_admin": current_user.is_admin
        }
    })


@app.route("/api/profile", methods=["POST"])
@login_required
def update_profile():
    username = (request.form.get("username") or "").strip()
    bio = (request.form.get("bio") or "").strip()

    if not username:
        return jsonify({"ok": False, "message": "Аты бос болмауы керек"}), 400

    current_user.username = username
    current_user.bio = bio

    avatar_file = request.files.get("avatar")
    if avatar_file and avatar_file.filename:
        ext = Path(avatar_file.filename).suffix.lower()
        if ext not in [".png", ".jpg", ".jpeg", ".webp"]:
            return jsonify({"ok": False, "message": "Тек png, jpg, jpeg, webp"}), 400

        avatar_name = f"{uuid.uuid4().hex}{ext}"
        avatar_file.save(UPLOADS_DIR / avatar_name)
        current_user.avatar = avatar_name

    db.session.commit()

    return jsonify({
        "ok": True,
        "message": "Профиль сақталды",
        "user": {
            "username": current_user.username,
            "email": current_user.email,
            "bio": current_user.bio,
            "avatar": current_user.avatar
        }
    })


@app.route("/api/reviews", methods=["GET", "POST"])
def reviews_api():
    if request.method == "POST":
        if not current_user.is_authenticated:
            return jsonify({"ok": False, "message": "Алдымен кіріңіз"}), 401

        data = request.get_json(force=True)
        text = (data.get("text") or "").strip()
        stars = int(data.get("stars") or 0)

        if not text or not stars:
            return jsonify({"ok": False, "message": "Пікір мен баға керек"}), 400

        review = Review(text=text, stars=stars, user_id=current_user.id)
        db.session.add(review)
        db.session.commit()

        return jsonify({"ok": True, "message": "Пікір сақталды"})

    reviews = Review.query.order_by(Review.id.desc()).all()
    return jsonify({
        "ok": True,
        "reviews": [
            {
                "id": r.id,
                "text": r.text,
                "stars": r.stars,
                "username": r.user.username
            }
            for r in reviews
        ]
    })


@app.route("/api/booking", methods=["POST"])
@login_required
def create_booking():
    data = request.get_json(force=True)

    booking = Booking(
        full_name=(data.get("full_name") or "").strip(),
        phone=(data.get("phone") or "").strip(),
        booking_date=(data.get("booking_date") or "").strip(),
        booking_time=(data.get("booking_time") or "").strip(),
        guests=int(data.get("guests") or 1),
        package_name=(data.get("package") or "Стандарт").strip(),
        payment_type=(data.get("payment") or "Қолма-қол").strip(),
        note=(data.get("note") or "").strip(),
        user_id=current_user.id
    )

    db.session.add(booking)
    db.session.commit()

    return jsonify({
        "ok": True,
        "message": "Брондау сақталды"
    })


# server.py ішіндегі chatbot_api функциясын осылай өзгертіңіз:

@app.route("/api/chatbot", methods=["POST"])
def chatbot_api():
    data = request.get_json(force=True)
    message = (data.get("message") or "").strip()
    # Сөздерді кіші әріпке келтіру (іздеу оңай болу үшін)
    msg_lower = message.lower()
    username = (data.get("username") or "guest")

    if not message:
        return jsonify({"ok": False, "message": "Хабар бос болмауы керек"}), 400

    # --- ЖАҢА: БАҒЫТТАУ ЛОГИКАСЫ (REDIRECT) ---
    redirect_url = None
    if "брондау" in msg_lower or "бронь" in msg_lower:
        redirect_url = "/booking.html"
    elif "баға" in msg_lower:
        redirect_url = "/prices.html"
    elif "қызмет" in msg_lower:
        redirect_url = "/services.html"
    elif "галерея" in msg_lower or "фото" in msg_lower:
        redirect_url = "/gallery.html"
    elif "пікір" in msg_lower:
        redirect_url = "/reviews.html"
    elif "байланыс" in msg_lower or "адрес" in msg_lower or "мекенжай" in msg_lower:
        redirect_url = "/contacts.html"
    elif "ойын" in msg_lower:
        redirect_url = "/games.html"
    elif "профиль" in msg_lower:
        redirect_url = "/profile.html"

    # --- 1-ҚАДАМ: ЖЕРГІЛІКТІ БАЗАДАН ІЗДЕУ ---
    local_answer = get_chatbot_response(message)

    # Егер базада жауап табылса, оны бірден қайтарамыз
    if local_answer != "Кешіріңіз, мен бұл сұраққа жауап бере алмаймын.":
        return jsonify({
            "ok": True,
            "answer": local_answer,
            "redirect": redirect_url  # Redirect сілтемесін қосамыз
        })

    # --- 2-ҚАДАМ: GEMINI-ГЕ ЖІБЕРУ ---
    joyland_context = """
    Сен JoyLand балалар ойын орталығының ресми көмекшісісің. 
    Мекенжай: Алматы қ., Grand Park. Жұмыс уақыты: 10:00-21:00.
    Бағалар: Стандарт (3000-5000 тг), Отбасылық (12,000 тг), Туған күн (45,000 тг-ден бастап).
    Нұсқау: Жауапты тек қазақ тілінде, сыпайы және өте қысқа қайтар.
    """

    try:
        full_prompt = f"{joyland_context}\n\nПайдаланушы сұрағы: {message}"
        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=full_prompt
        )
        answer = (response.text or "").strip()
        if not answer:
            answer = "Кешіріңіз, сұрағыңызды түсінбедім."

        # Тарихты сақтау
        history = load_json_file(CHATBOT_HISTORY_FILE, [])
        history.append({
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "username": username, "question": message, "answer": answer
        })
        save_json_file(CHATBOT_HISTORY_FILE, history)

        return jsonify({
            "ok": True,
            "answer": answer,
            "redirect": redirect_url  # Gemini жауабына да сілтемені қосамыз
        })

    except Exception as e:
        print("Gemini қатесі:", e)
        return jsonify({"ok": True, "answer": "Қазір көмекші бос емес. Сәлден соң қайталаңыз."})

# =========================
# INIT DB
# =========================
@app.cli.command("init-db")
def init_db():
    with app.app_context():
        db.create_all()
    print("Database created successfully.")


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)