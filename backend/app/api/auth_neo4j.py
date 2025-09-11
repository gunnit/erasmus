from fastapi import APIRouter, HTTPException, status
from datetime import timedelta
from app.db.neo4j_models import UserNode
from app.schemas.user import UserCreate, UserLogin, UserWithToken
from app.core.auth import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["authentication"])

@router.post("/register", response_model=UserWithToken)
async def register(user_data: UserCreate):
    try:
        # Check if user exists
        existing_user = UserNode.get_user_by_email(user_data.email)
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create new user
        new_user = UserNode.create_user(
            email=user_data.email,
            password=user_data.password,
            full_name=user_data.full_name or user_data.email.split('@')[0]
        )
        
        if not new_user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user"
            )
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": new_user['id'], "email": new_user['email']}, 
            expires_delta=access_token_expires
        )
        
        return UserWithToken(
            id=new_user['id'],
            email=new_user['email'],
            username=new_user['email'].split('@')[0],
            full_name=new_user.get('full_name', ''),
            organization=user_data.organization if hasattr(user_data, 'organization') else '',
            is_active=new_user.get('is_active', True),
            access_token=access_token
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )

@router.post("/login", response_model=UserWithToken)
async def login(user_credentials: UserLogin):
    try:
        # Verify user credentials
        email = user_credentials.username if '@' in user_credentials.username else f"{user_credentials.username}@example.com"
        
        if not UserNode.verify_password(email, user_credentials.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Get user data
        user = UserNode.get_user_by_email(email)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user['id'], "email": user['email']}, 
            expires_delta=access_token_expires
        )
        
        return UserWithToken(
            id=user['id'],
            email=user['email'],
            username=user['email'].split('@')[0],
            full_name=user.get('full_name', ''),
            organization='',
            is_active=user.get('is_active', True),
            access_token=access_token
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )

@router.get("/verify")
async def verify_token(current_user: dict = None):
    """Verify if the token is valid"""
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    return {"valid": True, "user_id": current_user.get('id')}