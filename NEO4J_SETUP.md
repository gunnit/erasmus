# Neo4j Integration Setup Guide

## Overview
This Erasmus+ grant application system now uses **Neo4j graph database** for all data storage, replacing the previous SQL-based system. This provides better relationship modeling for proposals, users, priorities, and answers.

## Quick Start

### 1. Automatic Setup (Recommended)
```bash
# Make script executable
chmod +x start-neo4j.sh

# Run the startup script
./start-neo4j.sh
```

This script will:
- Install Neo4j if not present
- Start Neo4j database
- Install Python dependencies
- Start backend with Neo4j integration
- Start frontend application

### 2. Manual Setup

#### Install Neo4j

**Ubuntu/Debian:**
```bash
wget -O - https://debian.neo4j.com/neotechnology.gpg.key | sudo apt-key add -
echo 'deb https://debian.neo4j.com stable latest' | sudo tee /etc/apt/sources.list.d/neo4j.list
sudo apt-get update
sudo apt-get install neo4j
```

**macOS:**
```bash
brew install neo4j
```

**Windows:**
Download from [https://neo4j.com/download/](https://neo4j.com/download/)

#### Start Neo4j
```bash
# Linux/macOS
neo4j start

# Or run in console mode
neo4j console
```

#### Configure Neo4j
1. Open Neo4j Browser: http://localhost:7474
2. Default credentials: neo4j/neo4j
3. Change password when prompted
4. Update `backend/.env` with new credentials:
```env
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_new_password
```

#### Install Backend Dependencies
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### Start Backend
```bash
# From backend directory with venv activated
uvicorn app.main_neo4j:app --reload --port 8000
```

#### Start Frontend
```bash
cd frontend
npm install
npm start
```

## Architecture Changes

### Database Schema

#### Nodes
- **User**: Stores user accounts
  - Properties: id, email, full_name, hashed_password, is_active, created_at, updated_at
  
- **Proposal**: Stores grant proposals
  - Properties: id, title, status, project_title, organization_name, budget, etc.
  
- **Answer**: Stores individual question answers
  - Properties: question_id, content, character_count
  
- **Priority**: EU funding priorities
  - Properties: code, name, description

#### Relationships
- `(User)-[:OWNS]->(Proposal)` - User owns proposals
- `(Proposal)-[:HAS_ANSWER]->(Answer)` - Proposal has answers
- `(Proposal)-[:ADDRESSES_PRIORITY]->(Priority)` - Proposal addresses priorities

### API Endpoints

All endpoints remain the same but now use Neo4j backend:

- **Authentication**
  - `POST /api/auth/register` - Register new user
  - `POST /api/auth/login` - User login
  
- **Proposals**
  - `GET /api/proposals/` - Get user proposals
  - `POST /api/proposals/` - Create proposal
  - `GET /api/proposals/{id}` - Get specific proposal
  - `PUT /api/proposals/{id}` - Update proposal
  - `DELETE /api/proposals/{id}` - Delete proposal
  
- **AI Generation**
  - `POST /api/form/generate-answers` - Generate complete application
  - `GET /api/form/questions` - Get form structure
  - `GET /api/form/priorities` - Get EU priorities

## Configuration

### Environment Variables

Create/update `backend/.env`:
```env
# AI Configuration (choose one)
ANTHROPIC_API_KEY=sk-ant-...  # For Claude (recommended)
OPENAI_API_KEY=sk-...          # For OpenAI fallback

# Neo4j Database
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password

# Security
SECRET_KEY=your-secret-key-change-in-production
```

### Neo4j Configuration

Default Neo4j settings work well, but for production consider:

**neo4j.conf adjustments:**
```properties
# Memory settings
dbms.memory.heap.initial_size=1g
dbms.memory.heap.max_size=2g
dbms.memory.pagecache.size=1g

# Network
dbms.connector.bolt.listen_address=:7687
dbms.connector.http.listen_address=:7474
```

## Testing

### Run Integration Tests
```bash
# Make sure backend is running first
python test-neo4j-integration.py
```

This tests:
- Neo4j connection
- User registration/login
- Proposal CRUD operations
- AI answer generation

### Manual Testing
1. Open http://localhost:3000
2. Register a new account
3. Create a proposal
4. Generate AI answers
5. Save and review

### Verify Neo4j Data
```cypher
# In Neo4j Browser (http://localhost:7474)

# Count all nodes
MATCH (n) RETURN count(n);

# View users
MATCH (u:User) RETURN u LIMIT 10;

# View proposals with owners
MATCH (u:User)-[:OWNS]->(p:Proposal) 
RETURN u.email, p.title, p.status;

# View proposal with answers
MATCH (p:Proposal)-[:HAS_ANSWER]->(a:Answer)
WHERE p.id = 'proposal_id_here'
RETURN p.title, a.question_id, a.content;
```

## Troubleshooting

### Neo4j Won't Start
```bash
# Check if port is in use
lsof -i :7687

# Check Neo4j logs
neo4j console  # Shows errors directly

# Reset Neo4j (WARNING: deletes all data)
neo4j stop
rm -rf /var/lib/neo4j/data/*
neo4j start
```

### Connection Refused
- Ensure Neo4j is running: `neo4j status`
- Check credentials in `backend/.env`
- Verify ports 7687 (Bolt) and 7474 (HTTP) are open

### Authentication Errors
```bash
# Reset Neo4j password
neo4j-admin set-initial-password newpassword
```

### Frontend Can't Connect to Backend
- Check CORS settings in `backend/app/main_neo4j.py`
- Ensure backend is running on port 8000
- Check browser console for errors

## Performance Optimization

### Indexes
The system automatically creates indexes on startup:
- User email (unique)
- Proposal ID (unique)
- Priority code (unique)

### Query Optimization
```cypher
# Add custom indexes if needed
CREATE INDEX proposal_status IF NOT EXISTS 
FOR (p:Proposal) ON (p.status);

CREATE INDEX answer_question IF NOT EXISTS 
FOR (a:Answer) ON (a.question_id);
```

## Backup & Restore

### Backup Neo4j Database
```bash
neo4j-admin dump --database=neo4j --to=backup.dump
```

### Restore Neo4j Database
```bash
neo4j stop
neo4j-admin load --from=backup.dump --database=neo4j --force
neo4j start
```

## Migration from SQL

If you have existing data in PostgreSQL/SQLite:

1. Export data to JSON
2. Run migration script (create if needed)
3. Import to Neo4j using Cypher queries

Example migration:
```python
# Simple migration example
import json
from app.db.neo4j_models import UserNode, ProposalNode

# Load exported data
with open('users.json') as f:
    users = json.load(f)

# Import to Neo4j
for user in users:
    UserNode.create_user(
        email=user['email'],
        password='temp_password',  # Users will need to reset
        full_name=user['full_name']
    )
```

## Production Deployment

### Docker Setup
```dockerfile
# docker-compose.yml
version: '3.8'

services:
  neo4j:
    image: neo4j:latest
    ports:
      - "7474:7474"
      - "7687:7687"
    environment:
      - NEO4J_AUTH=neo4j/your_password
    volumes:
      - neo4j_data:/data

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - NEO4J_URI=bolt://neo4j:7687
    depends_on:
      - neo4j

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  neo4j_data:
```

### Security Considerations
1. Change default Neo4j password
2. Use SSL/TLS for Bolt connections in production
3. Implement rate limiting
4. Use environment-specific configurations
5. Regular backups

## Support

For issues or questions:
1. Check Neo4j logs: `neo4j console`
2. Check backend logs: Check uvicorn output
3. Review this documentation
4. Check Neo4j documentation: https://neo4j.com/docs/