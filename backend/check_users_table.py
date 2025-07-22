import sqlite3

DB_PATH = 'exams.db'  # Chemin relatif au dossier backend

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

print('Tables présentes dans la base:')
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
for row in cursor.fetchall():
    print(row)

print('\nColonnes de la table users:')
cursor.execute("PRAGMA table_info(users);")
for row in cursor.fetchall():
    print(row)

conn.close()