from neo4j import GraphDatabase, basic_auth
from typing import Optional, Dict, Any, List
import os
from dotenv import load_dotenv
import logging

load_dotenv()

logger = logging.getLogger(__name__)

class Neo4jConnection:
    def __init__(self):
        self.driver = None
        self.uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
        self.user = os.getenv("NEO4J_USER", "neo4j")
        self.password = os.getenv("NEO4J_PASSWORD", "password")
        
    def connect(self):
        """Establish connection to Neo4j database"""
        try:
            self.driver = GraphDatabase.driver(
                self.uri,
                auth=basic_auth(self.user, self.password),
                max_connection_lifetime=3600
            )
            logger.info("Successfully connected to Neo4j")
        except Exception as e:
            logger.error(f"Failed to connect to Neo4j: {e}")
            raise
    
    def close(self):
        """Close the Neo4j connection"""
        if self.driver:
            self.driver.close()
            
    def get_session(self):
        """Get a Neo4j session"""
        if not self.driver:
            self.connect()
        return self.driver.session()
    
    def execute_query(self, query: str, parameters: Dict[str, Any] = None):
        """Execute a Cypher query"""
        with self.get_session() as session:
            result = session.run(query, parameters or {})
            return [record.data() for record in result]
    
    def execute_write(self, query: str, parameters: Dict[str, Any] = None):
        """Execute a write transaction"""
        with self.get_session() as session:
            with session.begin_transaction() as tx:
                result = tx.run(query, parameters or {})
                tx.commit()
                return [record.data() for record in result]

# Global instance
neo4j_db = Neo4jConnection()

def get_neo4j_db():
    """Dependency for FastAPI"""
    return neo4j_db

def init_neo4j_schema():
    """Initialize Neo4j schema with constraints and indexes"""
    queries = [
        # User constraints and indexes
        "CREATE CONSTRAINT user_email_unique IF NOT EXISTS FOR (u:User) REQUIRE u.email IS UNIQUE",
        "CREATE INDEX user_id_index IF NOT EXISTS FOR (u:User) ON (u.id)",
        
        # Proposal constraints and indexes  
        "CREATE CONSTRAINT proposal_id_unique IF NOT EXISTS FOR (p:Proposal) REQUIRE p.id IS UNIQUE",
        "CREATE INDEX proposal_title_index IF NOT EXISTS FOR (p:Proposal) ON (p.title)",
        "CREATE INDEX proposal_status_index IF NOT EXISTS FOR (p:Proposal) ON (p.status)",
        
        # Answer node indexes
        "CREATE INDEX answer_question_id IF NOT EXISTS FOR (a:Answer) ON (a.question_id)",
        
        # Priority node
        "CREATE CONSTRAINT priority_code_unique IF NOT EXISTS FOR (pr:Priority) REQUIRE pr.code IS UNIQUE"
    ]
    
    db = get_neo4j_db()
    for query in queries:
        try:
            db.execute_write(query)
            logger.info(f"Executed: {query[:50]}...")
        except Exception as e:
            logger.warning(f"Schema query failed (may already exist): {e}")