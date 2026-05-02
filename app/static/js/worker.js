// Web worker for heavy frontend processing
self.onmessage = function(e) {
    if (e.data.type === 'format') {
        let text = e.data.text;
        // Simple Markdown parsing simulation
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        text = text.replace(/\n/g, '<br>');
        
        self.postMessage({ type: 'formatted', text: text });
    }
};
