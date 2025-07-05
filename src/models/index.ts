export interface UserProfileResponse {
    id: string;
    linkedin_url?: string;
    auth_id: string;
    email: string;
    full_name: string;
    profile_picture?: string;
    uploaded_profile_image_url?: string | null;
    bio?: string;
    is_active: boolean;
    created_at: string; // ISO date string
    updated_at: string; // ISO date string
    last_active_at?: string | null; // ISO date string
    fields_of_expertise: string[];
    professional_background?: string;
    can_help_with?: string;
    interests: string[];
    personality_traits: string[];
    skills: string[];
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