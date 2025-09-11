from typing import Optional, Dict, Any, List
from datetime import datetime
import uuid
from pydantic import BaseModel, EmailStr, Field
import bcrypt
from .neo4j_db import get_neo4j_db

class UserNode:
    """Neo4j User Node operations"""
    
    @staticmethod
    def create_user(email: str, password: str, full_name: str = None) -> Dict[str, Any]:
        """Create a new user in Neo4j"""
        db = get_neo4j_db()
        user_id = str(uuid.uuid4())
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        query = """
        CREATE (u:User {
            id: $id,
            email: $email,
            hashed_password: $hashed_password,
            full_name: $full_name,
            is_active: true,
            created_at: datetime(),
            updated_at: datetime()
        })
        RETURN u
        """
        
        result = db.execute_write(query, {
            'id': user_id,
            'email': email,
            'hashed_password': hashed_password,
            'full_name': full_name or email.split('@')[0]
        })
        
        if result:
            user_data = result[0]['u']
            user_data.pop('hashed_password', None)
            return user_data
        return None
    
    @staticmethod
    def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
        """Get user by email"""
        db = get_neo4j_db()
        query = """
        MATCH (u:User {email: $email})
        RETURN u
        """
        result = db.execute_query(query, {'email': email})
        return result[0]['u'] if result else None
    
    @staticmethod
    def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        db = get_neo4j_db()
        query = """
        MATCH (u:User {id: $user_id})
        RETURN u
        """
        result = db.execute_query(query, {'user_id': user_id})
        if result:
            user_data = result[0]['u']
            user_data.pop('hashed_password', None)
            return user_data
        return None
    
    @staticmethod
    def verify_password(email: str, password: str) -> bool:
        """Verify user password"""
        user = UserNode.get_user_by_email(email)
        if not user:
            return False
        return bcrypt.checkpw(password.encode('utf-8'), user['hashed_password'].encode('utf-8'))
    
    @staticmethod
    def update_user(user_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update user information"""
        db = get_neo4j_db()
        set_clause = ", ".join([f"u.{key} = ${key}" for key in updates.keys()])
        query = f"""
        MATCH (u:User {{id: $user_id}})
        SET {set_clause}, u.updated_at = datetime()
        RETURN u
        """
        params = {'user_id': user_id, **updates}
        result = db.execute_write(query, params)
        if result:
            user_data = result[0]['u']
            user_data.pop('hashed_password', None)
            return user_data
        return None


class ProposalNode:
    """Neo4j Proposal Node operations"""
    
    @staticmethod
    def create_proposal(user_id: str, title: str, project_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new proposal linked to a user"""
        db = get_neo4j_db()
        proposal_id = str(uuid.uuid4())
        
        query = """
        MATCH (u:User {id: $user_id})
        CREATE (p:Proposal {
            id: $proposal_id,
            title: $title,
            status: $status,
            project_title: $project_title,
            project_acronym: $project_acronym,
            organization_name: $organization_name,
            organization_type: $organization_type,
            country: $country,
            project_duration: $project_duration,
            total_budget: $total_budget,
            grant_requested: $grant_requested,
            target_groups: $target_groups,
            main_activities: $main_activities,
            expected_results: $expected_results,
            created_at: datetime(),
            updated_at: datetime()
        })
        CREATE (u)-[:OWNS]->(p)
        RETURN p
        """
        
        params = {
            'user_id': user_id,
            'proposal_id': proposal_id,
            'title': title,
            'status': project_data.get('status', 'draft'),
            'project_title': project_data.get('project_title', title),
            'project_acronym': project_data.get('project_acronym', ''),
            'organization_name': project_data.get('organization_name', ''),
            'organization_type': project_data.get('organization_type', ''),
            'country': project_data.get('country', ''),
            'project_duration': project_data.get('project_duration', 24),
            'total_budget': project_data.get('total_budget', 0),
            'grant_requested': project_data.get('grant_requested', 0),
            'target_groups': project_data.get('target_groups', []),
            'main_activities': project_data.get('main_activities', ''),
            'expected_results': project_data.get('expected_results', '')
        }
        
        result = db.execute_write(query, params)
        return result[0]['p'] if result else None
    
    @staticmethod
    def get_user_proposals(user_id: str) -> List[Dict[str, Any]]:
        """Get all proposals for a user"""
        db = get_neo4j_db()
        query = """
        MATCH (u:User {id: $user_id})-[:OWNS]->(p:Proposal)
        RETURN p
        ORDER BY p.created_at DESC
        """
        result = db.execute_query(query, {'user_id': user_id})
        return [record['p'] for record in result]
    
    @staticmethod
    def get_proposal_by_id(proposal_id: str, user_id: str = None) -> Optional[Dict[str, Any]]:
        """Get proposal by ID, optionally filtered by user"""
        db = get_neo4j_db()
        if user_id:
            query = """
            MATCH (u:User {id: $user_id})-[:OWNS]->(p:Proposal {id: $proposal_id})
            RETURN p
            """
            params = {'user_id': user_id, 'proposal_id': proposal_id}
        else:
            query = """
            MATCH (p:Proposal {id: $proposal_id})
            RETURN p
            """
            params = {'proposal_id': proposal_id}
        
        result = db.execute_query(query, params)
        return result[0]['p'] if result else None
    
    @staticmethod
    def update_proposal(proposal_id: str, user_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update proposal"""
        db = get_neo4j_db()
        set_clause = ", ".join([f"p.{key} = ${key}" for key in updates.keys() if key != 'answers'])
        
        query = f"""
        MATCH (u:User {{id: $user_id}})-[:OWNS]->(p:Proposal {{id: $proposal_id}})
        SET {set_clause}, p.updated_at = datetime()
        RETURN p
        """
        
        params = {'user_id': user_id, 'proposal_id': proposal_id, **updates}
        result = db.execute_write(query, params)
        
        # Handle answers separately if provided
        if result and 'answers' in updates:
            ProposalNode.save_answers(proposal_id, updates['answers'])
        
        return result[0]['p'] if result else None
    
    @staticmethod
    def save_answers(proposal_id: str, answers: Dict[str, Any]) -> bool:
        """Save proposal answers as separate nodes"""
        db = get_neo4j_db()
        
        # Delete existing answers
        delete_query = """
        MATCH (p:Proposal {id: $proposal_id})-[:HAS_ANSWER]->(a:Answer)
        DETACH DELETE a
        """
        db.execute_write(delete_query, {'proposal_id': proposal_id})
        
        # Create new answer nodes
        for question_id, answer_data in answers.items():
            create_query = """
            MATCH (p:Proposal {id: $proposal_id})
            CREATE (a:Answer {
                question_id: $question_id,
                content: $content,
                character_count: $character_count,
                updated_at: datetime()
            })
            CREATE (p)-[:HAS_ANSWER]->(a)
            """
            
            params = {
                'proposal_id': proposal_id,
                'question_id': question_id,
                'content': answer_data.get('answer', '') if isinstance(answer_data, dict) else answer_data,
                'character_count': len(answer_data.get('answer', '') if isinstance(answer_data, dict) else answer_data)
            }
            
            db.execute_write(create_query, params)
        
        return True
    
    @staticmethod
    def get_proposal_answers(proposal_id: str) -> Dict[str, Any]:
        """Get all answers for a proposal"""
        db = get_neo4j_db()
        query = """
        MATCH (p:Proposal {id: $proposal_id})-[:HAS_ANSWER]->(a:Answer)
        RETURN a.question_id as question_id, a.content as content
        """
        result = db.execute_query(query, {'proposal_id': proposal_id})
        return {record['question_id']: record['content'] for record in result}
    
    @staticmethod
    def delete_proposal(proposal_id: str, user_id: str) -> bool:
        """Delete a proposal and all related data"""
        db = get_neo4j_db()
        query = """
        MATCH (u:User {id: $user_id})-[:OWNS]->(p:Proposal {id: $proposal_id})
        OPTIONAL MATCH (p)-[:HAS_ANSWER]->(a:Answer)
        DETACH DELETE p, a
        RETURN count(p) as deleted
        """
        result = db.execute_write(query, {'user_id': user_id, 'proposal_id': proposal_id})
        return result[0]['deleted'] > 0 if result else False


class PriorityNode:
    """Neo4j Priority Node operations"""
    
    @staticmethod
    def create_priority(code: str, name: str, description: str) -> Dict[str, Any]:
        """Create or update a priority"""
        db = get_neo4j_db()
        query = """
        MERGE (pr:Priority {code: $code})
        SET pr.name = $name, pr.description = $description
        RETURN pr
        """
        result = db.execute_write(query, {
            'code': code,
            'name': name,
            'description': description
        })
        return result[0]['pr'] if result else None
    
    @staticmethod
    def get_all_priorities() -> List[Dict[str, Any]]:
        """Get all priorities"""
        db = get_neo4j_db()
        query = """
        MATCH (pr:Priority)
        RETURN pr
        ORDER BY pr.code
        """
        result = db.execute_query(query)
        return [record['pr'] for record in result]
    
    @staticmethod
    def link_proposal_to_priorities(proposal_id: str, priority_codes: List[str]):
        """Link a proposal to multiple priorities"""
        db = get_neo4j_db()
        
        # Remove existing priority links
        delete_query = """
        MATCH (p:Proposal {id: $proposal_id})-[r:ADDRESSES_PRIORITY]->(:Priority)
        DELETE r
        """
        db.execute_write(delete_query, {'proposal_id': proposal_id})
        
        # Create new priority links
        for code in priority_codes:
            create_query = """
            MATCH (p:Proposal {id: $proposal_id})
            MATCH (pr:Priority {code: $code})
            CREATE (p)-[:ADDRESSES_PRIORITY]->(pr)
            """
            db.execute_write(create_query, {'proposal_id': proposal_id, 'code': code})


def init_sample_data():
    """Initialize sample priorities in Neo4j"""
    priorities = [
        {
            'code': 'INCLUSION',
            'name': 'Inclusion and Diversity',
            'description': 'Promoting social inclusion and reducing inequalities'
        },
        {
            'code': 'DIGITAL',
            'name': 'Digital Transformation',
            'description': 'Digital skills and digital transformation in education'
        },
        {
            'code': 'GREEN',
            'name': 'Green Transition',
            'description': 'Environmental sustainability and climate action'
        },
        {
            'code': 'PARTICIPATION',
            'name': 'Democratic Participation',
            'description': 'Active citizenship and democratic values'
        }
    ]
    
    for priority in priorities:
        PriorityNode.create_priority(**priority)