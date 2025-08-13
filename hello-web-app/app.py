from http.server import HTTPServer, BaseHTTPRequestHandler

class HelloHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        self.wfile.write(b'<h1>Hello World from Docker!</h1><p>This is running inside a container!</p>')

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', 8080), HelloHandler)
    print("Server running on port 8080...")
    server.serve_forever()
