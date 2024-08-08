from flask import Flask, render_template, request
import os
from langchain import hub
from ingest import create_vector_database
from main import qa_bot
from rag1 import process_uploaded_files, answer_question

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Home page
@app.route('/')
def index():
    return render_template('index.html')

# Ask Questions page
@app.route('/ask_questions', methods=['GET', 'POST'])
def ask_questions():
    if request.method == 'POST':
        question = request.form['question']
        bot = qa_bot()
        res = bot.call(question)
        answer = res['result']
        return render_template('ask_questions.html', answer=answer)
    return render_template('ask_questions.html')

# Upload Files and Ask Questions page
@app.route('/upload_files', methods=['GET', 'POST'])
def upload_files():
    if request.method == 'POST':
        question = request.form['question']
        uploaded_files = request.files.getlist('files')
        file_paths = []
        for file in uploaded_files:
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
            file.save(file_path)
            file_paths.append(file_path)
        answer = process_uploaded_files(file_paths, question)
        return render_template('upload_files.html', answer=answer)
    return render_template('upload_files.html')

if __name__ == '__main__':
    create_vector_database()
    app.run(debug=True)
