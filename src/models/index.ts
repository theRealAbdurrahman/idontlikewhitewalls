export interface UserProfileResponse {
    full_name: string;
    fields_of_expertise: string[];
    profile_picture: string;
    professional_background: string;
    bio: string;
    can_help_with: string;
    is_active: boolean;
    interests: string[];
    linkedin_url: string;
    created_at: string;
    personality_traits: string[];
    id: string;
    updated_at: string;
    skills: string[];
    auth_id: string;
    last_active_at: string | null;
    email: string;
}

export interface LogtoDecodedUser {
    sub: string;
    name: string | null;
    picture: string | null;
    updated_at: number;
    username: string | null;
    created_at: number;
    email: string;
    email_verified: boolean;
    phone_number: string | null;
    phone_number_verified: boolean;
    at_hash: string;
    aud: string;
    exp: number;
    iat: number;
    iss: string;
}

export interface UserProfileApiResponse {
    data: UserProfileResponse;
    decoded: LogtoDecodedUser;
}