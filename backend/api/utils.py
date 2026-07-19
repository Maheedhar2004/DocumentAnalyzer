import os
import re
from pypdf import PdfReader
from docx import Document as DocxDocument
from groq import Groq

def extract_text_from_file(file_path, file_type):
    """
    Extracts plain text content from PDF, DOCX, or TXT files.
    """
    content = ""
    file_type = file_type.lower()
    
    try:
        if file_type == 'pdf':
            reader = PdfReader(file_path)
            text_list = []
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    text_list.append(text)
            content = "\n".join(text_list)
            
        elif file_type in ['docx', 'doc']:
            doc = DocxDocument(file_path)
            content = "\n".join([paragraph.text for paragraph in doc.paragraphs])
            
        elif file_type == 'txt':
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
            except UnicodeDecodeError:
                with open(file_path, 'r', encoding='latin-1') as f:
                    content = f.read()
    except Exception as e:
        print(f"Error extracting text from {file_path}: {e}")
        content = f"Error extracting text from file: {str(e)}"
        
    return content.strip()

def get_groq_client():
    """
    Retrieves a Groq client if the API key is configured.
    Returns None if missing or default.
    """
    api_key = os.getenv('GROQ_API_KEY')
    if not api_key or api_key == 'your_groq_api_key_here' or api_key.strip() == '':
        return None
    try:
        return Groq(api_key=api_key)
    except Exception:
        return None

def generate_summary_and_keywords(text):
    """
    Generates a brief summary, extracts 5-10 keywords, and detects language from document text.
    Uses Groq if available, otherwise runs a smart local mock generator.
    """
    if not text:
        return "Empty document.", [], "English"

    # Limit text size to prevent context overflow in LLM calls (e.g. keep first ~15k chars for summary context)
    truncated_text = text[:15000]
    
    client = get_groq_client()
    if client:
        try:
            prompt = (
                "You are an expert document assistant. Analyze the text below and return a JSON object "
                "with three keys: 'summary' (a concise 3-4 sentence summary of the document), 'keywords' "
                "(a list of 5 to 8 relevant key topics/words/phrases found in the text), and 'language' "
                "(the primary language of the text, e.g., 'English', 'Spanish', 'French', etc.).\n\n"
                "Return ONLY valid JSON. Do not include markdown code block formatting (like ```json).\n\n"
                f"Text:\n{truncated_text}"
            )
            response = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a precise JSON generator. Output valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                model="llama-3.1-8b-instant",
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            import json
            result = json.loads(response.choices[0].message.content)
            return result.get('summary', ''), result.get('keywords', []), result.get('language', 'English')
        except Exception as e:
            print(f"Groq API error during summary generation: {e}. Falling back to mock.")
            # Fall through to mock generator

    # Fallback/Mock Summary Generator
    # Extract keywords using regex & word frequency
    words = re.findall(r'\b[a-zA-Z]{4,15}\b', text.lower())
    stop_words = {
        'the', 'and', 'that', 'this', 'with', 'from', 'your', 'have', 'were', 'they', 
        'will', 'about', 'would', 'their', 'there', 'what', 'which', 'when', 'where', 
        'documents', 'document', 'file', 'content', 'text', 'user', 'system', 'please'
    }
    filtered_words = [w for w in words if w not in stop_words]
    
    # Calculate word frequency
    freq = {}
    for w in filtered_words:
        freq[w] = freq.get(w, 0) + 1
    
    sorted_keywords = sorted(freq.items(), key=lambda x: x[1], reverse=True)
    keywords = [kw[0].capitalize() for kw in sorted_keywords[:6]]
    if not keywords:
        keywords = ["Document", "Text", "Content"]
        
    sentences = re.split(r'(?<=[.!?])\s+', text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 15]
    summary_sentences = sentences[:3]
    summary = " ".join(summary_sentences)
    if not summary:
        summary = "This document contains plain text content. No sentences were long enough to compile a summary."
    else:
        summary = f"Summary (Mock AI Mode): {summary}"
        
    return summary, keywords, 'English'

def find_source_reference(document_content, answer_text):
    """
    Heuristically finds where in the document the answer likely came from.
    Returns (page_number, paragraph_number, excerpt) tuple.
    Page numbers are estimated assuming ~500 words per page.
    """
    if not document_content or not answer_text:
        return None, None, ''

    # Split document into paragraphs
    paragraphs = [p.strip() for p in re.split(r'\n{2,}', document_content) if len(p.strip()) > 30]
    if not paragraphs:
        paragraphs = [s.strip() for s in re.split(r'(?<=[.!?])\s+', document_content) if len(s.strip()) > 30]

    # Extract meaningful words from the answer for matching
    answer_words = set(re.findall(r'\b[a-zA-Z]{4,}\b', answer_text.lower()))
    stop_words = {'that', 'this', 'with', 'from', 'your', 'have', 'were', 'they', 'will', 'about', 'would', 'their'}
    answer_words -= stop_words

    best_score = 0
    best_para_idx = 0
    for i, para in enumerate(paragraphs):
        para_words = set(re.findall(r'\b[a-zA-Z]{4,}\b', para.lower()))
        score = len(answer_words & para_words)
        if score > best_score:
            best_score = score
            best_para_idx = i

    if best_score == 0:
        return None, None, ''

    best_para = paragraphs[best_para_idx]
    # Estimate page: count words before this paragraph
    words_before = sum(len(p.split()) for p in paragraphs[:best_para_idx])
    estimated_page = max(1, (words_before // 500) + 1)
    para_number = best_para_idx + 1
    excerpt = best_para[:120].strip()
    if len(best_para) > 120:
        excerpt += '...'
    return estimated_page, para_number, excerpt


def chat_with_document(document_content, chat_history, new_message):
    """
    Answers questions about a document using chat history and Groq LLM.
    Returns a dict: { 'answer': str, 'source_page': int|None, 'source_paragraph': int|None, 'source_text': str }
    Uses Groq if available, otherwise falls back to a smart mock response.
    """
    if not document_content:
        document_content = "[No text content found in document]"
        
    client = get_groq_client()
    if client:
        try:
            # Build messages list — ask Groq to return JSON with answer + source reference
            messages = [
                {
                    "role": "system", 
                    "content": (
                        "You are an AI Document Assistant. You help users answer questions and interact with "
                        "their uploaded document. Here is the content of the document they uploaded:\n\n"
                        f"--- DOCUMENT CONTENT START ---\n{document_content[:20000]}\n--- DOCUMENT CONTENT END ---\n\n"
                        "Answer the user's questions truthfully based on the document content provided. "
                        "Return a JSON object with exactly these keys:\n"
                        "- 'answer': your full answer as a string\n"
                        "- 'source_page': the estimated page number (integer, 1-indexed, ~500 words per page) where the answer comes from, or null\n"
                        "- 'source_paragraph': the paragraph number (integer, 1-indexed) in the source page where the answer comes from, or null\n"
                        "- 'source_text': a short excerpt (max 100 chars) of the most relevant sentence from the document that supports the answer, or empty string\n"
                        "If the answer cannot be found in the document, still return the JSON with null source fields."
                    )
                }
            ]
            
            # Add chat history (up to last 10 messages)
            for msg in chat_history[-10:]:
                role = "user" if msg['sender'] == 'user' else "assistant"
                messages.append({"role": role, "content": msg['message']})
                
            # Add new message
            messages.append({"role": "user", "content": new_message})
            
            response = client.chat.completions.create(
                messages=messages,
                model="llama-3.3-70b-versatile",
                temperature=0.5,
                max_tokens=1024,
                response_format={"type": "json_object"}
            )
            import json
            result = json.loads(response.choices[0].message.content)
            return {
                'answer': result.get('answer', ''),
                'source_page': result.get('source_page'),
                'source_paragraph': result.get('source_paragraph'),
                'source_text': result.get('source_text', ''),
            }
        except Exception as e:
            print(f"Groq API error during chat: {e}. Falling back to mock.")
            # Fall through to mock

    # Mock Chat Response
    new_message_lower = new_message.lower()
    
    # Try to find some matching keywords or sentences in document content
    matched_sentences = []
    if document_content and document_content != "[No text content found in document]":
        sentences = re.split(r'(?<=[.!?])\s+', document_content)
        query_words = [w for w in re.findall(r'\b[a-zA-Z]{3,15}\b', new_message_lower) if w not in {'what', 'how', 'why', 'who', 'the', 'and', 'you', 'can'}]
        for s in sentences:
            s_lower = s.lower()
            if any(qw in s_lower for qw in query_words):
                matched_sentences.append(s.strip())
                if len(matched_sentences) >= 3:
                    break
                    
    if matched_sentences:
        answer = (
            "*(Mock AI Mode: I found some relevant information in the document)*\n\n"
            + "\n\n".join([f"- {s}" for s in matched_sentences])
        )
    else:
        answer = (
            f"*(Mock AI Mode)*\n\n"
            f"You asked: '{new_message}'\n\n"
            f"Since the Groq API key is not configured in `backend/.env`, I am running in Mock Mode. "
            f"I analyzed the document but couldn't find a direct keyword match for your query. "
            f"Please configure your `GROQ_API_KEY` in the environment files to enable live AI responses."
        )

    # Heuristically find source reference for mock mode
    source_page, source_paragraph, source_text = find_source_reference(document_content, answer)
    return {
        'answer': answer,
        'source_page': source_page,
        'source_paragraph': source_paragraph,
        'source_text': source_text,
    }

def translate_text(text, target_language):
    """
    Translates document content or summary to a target language.
    """
    if not text:
        return "Nothing to translate."
        
    client = get_groq_client()
    if client:
        try:
            prompt = (
                f"Translate the following text into {target_language}. Maintain the same tone and formatting "
                "where possible. Output ONLY the translation without any conversational preambles.\n\n"
                f"Text:\n{text[:5000]}"
            )
            response = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a precise translator."},
                    {"role": "user", "content": prompt}
                ],
                model="llama-3.1-8b-instant",
                temperature=0.3
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Groq API error during translation: {e}. Falling back to mock.")
            
    # Mock Translation
    mock_translations = {
        "spanish": f"[Translated to Spanish (Mock Mode)]:\n\n{text[:500]}...",
        "french": f"[Translated to French (Mock Mode)]:\n\n{text[:500]}...",
        "german": f"[Translated to German (Mock Mode)]:\n\n{text[:500]}...",
        "italian": f"[Translated to Italian (Mock Mode)]:\n\n{text[:500]}...",
        "portuguese": f"[Translated to Portuguese (Mock Mode)]:\n\n{text[:500]}...",
        "hindi": f"[Translated to Hindi (Mock Mode)]:\n\n{text[:500]}...",
        "chinese": f"[Translated to Chinese (Mock Mode)]:\n\n{text[:500]}...",
        "japanese": f"[Translated to Japanese (Mock Mode)]:\n\n{text[:500]}...",
    }
    return mock_translations.get(target_language.lower(), f"[Translated to {target_language} (Mock Mode)]:\n\n{text[:500]}...")

def generate_comparison_report(doc1_content, doc1_name, doc2_content, doc2_name):
    """
    Compares two documents and generates a comparison report using Groq.
    """
    client = get_groq_client()
    if client:
        try:
            prompt = (
                f"You are an expert contract analyzer and document comparison assistant. Compare the following two documents:\n\n"
                f"Document 1 Name: {doc1_name}\n"
                f"Document 1 Content:\n{doc1_content[:15000]}\n\n"
                f"Document 2 Name: {doc2_name}\n"
                f"Document 2 Content:\n{doc2_content[:15000]}\n\n"
                f"Analyze and return a JSON object with the following structure:\n"
                f"{{\n"
                f"  \"summary\": \"A high-level summary comparing both documents (2-3 sentences).\",\n"
                f"  \"differences\": [\n"
                f"    {{\n"
                f"      \"topic\": \"Name of the clause or topic (e.g., Liability, Payment Terms)\",\n"
                f"      \"doc1_version\": \"What doc 1 says about this topic\",\n"
                f"      \"doc2_version\": \"What doc 2 says about this topic\",\n"
                f"      \"difference_type\": \"High / Medium / Low\"\n"
                f"    }}\n"
                f"  ],\n"
                f"  \"missing_clauses\": [\n"
                f"    {{\n"
                f"      \"document_missing_from\": \"Name of the document that is missing the clause (either '{doc1_name}' or '{doc2_name}')\",\n"
                f"      \"clause_name\": \"Name of the missing clause\",\n"
                f"      \"description\": \"Description of the missing clause and why it is important\"\n"
                f"    }}\n"
                f"  ],\n"
                f"  \"comparison_report_markdown\": \"A detailed contract comparison report formatted in rich markdown with headers, bullet points, and clean structure.\"\n"
                f"}}\n\n"
                f"Return ONLY valid JSON. Do not include markdown code blocks around the JSON output."
            )
            response = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a precise JSON generator. Output valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            import json
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"Groq API error during comparison: {e}. Falling back to mock.")
            
    # Fallback/Mock Comparison Report
    return {
        "summary": f"This is a mock comparison report comparing '{doc1_name}' and '{doc2_name}' because the Groq LLM service is offline or not configured.",
        "differences": [
            {
                "topic": "Document Length and Structure",
                "doc1_version": f"Contains approximately {len(doc1_content.split())} words.",
                "doc2_version": f"Contains approximately {len(doc2_content.split())} words.",
                "difference_type": "Medium"
            },
            {
                "topic": "Key Entities Mentioned",
                "doc1_version": "Entities: " + ", ".join(list(set(re.findall(r'\b[A-Z][a-z]{3,10}\b', doc1_content)))[:5]),
                "doc2_version": "Entities: " + ", ".join(list(set(re.findall(r'\b[A-Z][a-z]{3,10}\b', doc2_content)))[:5]),
                "difference_type": "Low"
            }
        ],
        "missing_clauses": [
            {
                "document_missing_from": doc2_name,
                "clause_name": "Limitation of Liability",
                "description": "Standard liability limitation language was not detected in the content of the second document."
            }
        ],
        "comparison_report_markdown": f"# Comparison Report (Mock Mode)\n\n## Overview\nWe compared **{doc1_name}** and **{doc2_name}**.\n\n- **{doc1_name}** word count: {len(doc1_content.split())} words.\n- **{doc2_name}** word count: {len(doc2_content.split())} words.\n\n## Key Differences\n- The documents differ in word length, sentence structures, and key entity frequencies.\n\n## Recommendations\nConfigure your `GROQ_API_KEY` to run advanced contract comparisons and identify missing clauses using deep learning."
    }
