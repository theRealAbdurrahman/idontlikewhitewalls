import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./screens/Home";
import { Events } from "./screens/Events";
import { Messages } from "./screens/Messages";
import { Notifications } from "./screens/Notifications";
import { Profile } from "./screens/Profile";
import { CreateQuestion } from "./screens/CreateQuestion";
import { CreateEvent } from "./screens/CreateEvent";
import { CreateCommunity } from "./screens/CreateCommunity";
import { Communities } from "./screens/Communities";
import { EventDetails } from "./screens/EventDetails";
import { QuestionDetails } from "./screens/QuestionDetails";
import { UserProfile } from "./screens/UserProfile";
import { ProfilePage } from "./screens/ProfilePage";
import { Chat } from "./screens/Chat";
import { SuggestFeature } from "./screens/SuggestFeature";
import { SignupFlow } from "./screens/SignupFlow";
import { Callback } from "./screens/Callback";
import { AuthProvider } from "./contexts/AuthContext";

import { LogtoProvider, LogtoConfig } from '@logto/react';
import { Login } from "./screens/Login";

const config: LogtoConfig = {
  endpoint: 'https://y42e79.logto.app/',
  appId: 'uhmy6e6frjsbed2pwni1u',
};

export const App = (): JSX.Element => {
  return (
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/home" element={<Home />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetails />} />
            <Route path="/questions/:id" element={<QuestionDetails />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/chat/:id" element={<Chat />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile/:id" element={<ProfilePage />} />
            <Route path="/create-question" element={<CreateQuestion />} />
            <Route path="/create-event" element={<CreateEvent />} />
            <Route path="/create-community" element={<CreateCommunity />} />
            <Route path="/communities" element={<Communities />} />
            <Route path="/suggest-feature" element={<SuggestFeature />} />
            <Route path="/signup" element={<SignupFlow />} />
            <Route path="/callback" element={<Callback />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </Layout>
      </AuthProvider>
   
  );
};