import unittest
from app import create_app

class TestElectionAssistant(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()

    def test_home_page(self):
        """Test if the home page loads correctly"""
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)

    def test_api_chat_empty(self):
        """Test if API handles empty requests correctly"""
        response = self.client.post('/api/chat', json={})
        self.assertEqual(response.status_code, 400)

    def test_api_autocomplete(self):
        """Test the autocomplete endpoint"""
        response = self.client.get('/api/autocomplete?q=vote')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn('suggestions', data)

if __name__ == '__main__':
    unittest.main()
