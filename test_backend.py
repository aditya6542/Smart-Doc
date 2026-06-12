import unittest
import os
import json
import shutil
import main
from main import DocumentData, DocumentStyle

class TestSmartDocumentStudioBackend(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        # Override the documents directory for testing to prevent modifying active user data
        cls.test_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_documents")
        os.makedirs(cls.test_dir, exist_ok=True)
        main.DOCS_DIR = cls.test_dir

    @classmethod
    def tearDownClass(cls):
        # Clean up testing directory after test completion
        if os.path.exists(cls.test_dir):
            shutil.rmtree(cls.test_dir)

    def setUp(self):
        # Clear files in test_dir before each test
        for filename in os.listdir(self.test_dir):
            file_path = os.path.join(self.test_dir, filename)
            if os.path.isfile(file_path):
                os.remove(file_path)

    def test_create_and_get_document(self):
        doc = DocumentData(
            id="test-doc-123",
            title="Introduction to Microservices",
            content="<h1>Header</h1><p>Content goes here</p>",
            raw_text="Header\nContent goes here",
            styles=DocumentStyle(themeColor="business", fontFamily="Outfit")
        )
        
        # Create
        created = main.create_document(doc)
        self.assertEqual(created["id"], "test-doc-123")
        self.assertEqual(created["title"], "Introduction to Microservices")
        
        # Verify file exists
        self.assertTrue(os.path.exists(main.get_doc_path("test-doc-123")))
        
        # Read
        retrieved = main.get_document("test-doc-123")
        self.assertEqual(retrieved["title"], "Introduction to Microservices")
        self.assertEqual(retrieved["content"], "<h1>Header</h1><p>Content goes here</p>")
        self.assertEqual(retrieved["styles"]["themeColor"], "business")
        
    def test_update_document_and_versioning(self):
        doc = DocumentData(
            id="test-doc-update",
            title="Versioned Document",
            content="<p>First Draft</p>",
            styles=DocumentStyle()
        )
        main.create_document(doc)
        
        # Update with version snapshot
        updated_doc = DocumentData(
            title="Versioned Document (Updated)",
            content="<p>Second Draft - Finalized</p>",
            styles=DocumentStyle()
        )
        
        main.update_document("test-doc-update", updated_doc, create_version=True, version_title="Review Release")
        
        # Verify changes & versions list
        doc_data = main.read_doc("test-doc-update")
        self.assertEqual(doc_data["title"], "Versioned Document (Updated)")
        self.assertEqual(doc_data["content"], "<p>Second Draft - Finalized</p>")
        self.assertEqual(len(doc_data["versions"]), 2) # Initial + Update
        self.assertEqual(doc_data["versions"][0]["title"], "Review Release")

    def test_duplicate_and_delete_document(self):
        doc = DocumentData(
            id="test-doc-dupe",
            title="Original Copy",
            content="<p>Core content</p>",
            styles=DocumentStyle()
        )
        main.create_document(doc)
        
        # Duplicate
        duplicated = main.duplicate_document("test-doc-dupe")
        self.assertNotEqual(duplicated["id"], "test-doc-dupe")
        self.assertEqual(duplicated["title"], "Copy of Original Copy")
        
        # Delete original
        result = main.delete_document("test-doc-dupe")
        self.assertEqual(result["status"], "success")
        
        # Check deletion
        with self.assertRaises(Exception):
            main.get_document("test-doc-dupe")

    def test_ai_converter_parsing(self):
        raw_text = """# Software Architecting
## Consensus systems

This represents key notes on consensus.
- Paxos: single proposer
- Raft: leader-based election

> Consensus is hard but required for state synchronization.

---

| Protocol | Leader | Latency |
| Paxos | No | Low |
| Raft | Yes | Low |
"""
        result = main.convert_raw_text({"text": raw_text})
        self.assertEqual(result["title"], "Software Architecting")
        
        html = result["html"]
        self.assertIn("<h1>Software Architecting</h1>", html)
        self.assertIn("<h2>Consensus systems</h2>", html)
        self.assertIn("<ul>", html)
        self.assertIn("<li>Paxos: single proposer</li>", html)
        self.assertIn("<blockquote><p>Consensus is hard but required for state synchronization.</p></blockquote>", html)
        self.assertIn("<table>", html)
        self.assertIn("<th>Protocol</th>", html)
        self.assertIn("<td>Raft</td>", html)

    def test_ai_enhancer_heuristics(self):
        # Grammar correction test
        grammar_in = "Teh report was recieved yesterday, and dont worry about it."
        result = main.enhance_text({"text": grammar_in, "mode": "grammar"})
        self.assertEqual(result["text"], "The report was received yesterday, and don't worry about it.")

        # Professional rewrites
        prof_in = "make a good job for boss"
        result = main.enhance_text({"text": prof_in, "mode": "professional"})
        self.assertIn("generate", result["text"].lower())
        self.assertIn("highly effective", result["text"].lower())
        self.assertIn("supervisor", result["text"].lower())

    def test_qa_block_parsing(self):
        raw_text = """Q1. What is Python?
Python is high-level.
■ This is a callout note.
Note: Another callout note with **bold** text.
Q: Final question?
"""
        result = main.convert_raw_text({"text": raw_text})
        html = result["html"]
        self.assertIn('<div class="qa-question-bar"><strong>Q1. </strong>What is Python?</div>', html)
        self.assertIn('<div class="qa-callout-note"><strong>■ </strong> This is a callout note.</div>', html)
        self.assertIn('<div class="qa-callout-note"><strong>Note: </strong> Another callout note with <strong>bold</strong> text.</div>', html)
        self.assertIn('<div class="qa-question-bar"><strong>Q: </strong>Final question?</div>', html)

    def test_clear_all_documents(self):
        doc1 = DocumentData(
            id="test-doc-clear-1",
            title="Doc 1",
            content="<p>Doc 1</p>",
            styles=DocumentStyle()
        )
        doc2 = DocumentData(
            id="test-doc-clear-2",
            title="Doc 2",
            content="<p>Doc 2</p>",
            styles=DocumentStyle()
        )
        main.create_document(doc1)
        main.create_document(doc2)
        
        # Verify 2 files exist
        self.assertEqual(len(os.listdir(self.test_dir)), 2)
        
        # Clear all
        result = main.clear_all_documents()
        self.assertEqual(result["status"], "success")
        self.assertEqual(len(os.listdir(self.test_dir)), 0)

if __name__ == "__main__":
    unittest.main()
