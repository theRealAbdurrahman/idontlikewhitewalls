{
  pkgs ? import <nixpkgs> { },
}:

pkgs.mkShell {
  buildInputs = with pkgs; [
    # Node.js for frontend development
    nodejs_22
    nodePackages.npm

    # General utilities
    curl
    jq
    git
  ];

  shellHook = ''
    echo "🎨 Meetball Frontend Development Environment"
    echo ""
    echo "Available commands:"
    echo "⚛️  Frontend:"
    echo "  npm install               # Install dependencies"
    echo "  npm run dev               # Start development server"
    echo "  npm run build             # Build for production"
    echo ""
    echo "🌐 Testing:"
    echo "  curl http://localhost:5173/health || echo 'Frontend not running'"
    echo ""
    echo "📖 Getting Started:"
    echo "  npm install && npm run dev"
    echo ""

    # Ensure node modules are available
    export PATH="$PWD/node_modules/.bin:$PATH"
  '';
}