import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./screens/Home";
import { Events } from "./screens/Events";
import { Messages } from "./screens/Messages";
import { Notifications } from "./screens/Notifications";
import { CreateQuestion } from "./screens/CreateQuestion";
import { CreateEvent } from "./screens/CreateEvent";
import { CreateCommunity } from "./screens/CreateCommunity";
import { Communities } from "./screens/Communities";
import { EventDetails } from "./screens/EventDetails";
import { QuestionDetails } from "./screens/QuestionDetails";
import { ProfilePage } from "./screens/ProfilePage";
import { Chat } from "./screens/Chat";
import { SuggestFeature } from "./screens/SuggestFeature";
import { Callback } from "./screens/Callback";
import { AuthProvider } from "./contexts/AuthContext";

import { LogtoProvider, LogtoConfig, UserScope } from '@logto/react';
import { Login } from "./screens/Login";
import { SignupFlow } from "./screens/SignupFlow";
import { Logout } from "./screens/Logout";

const config: LogtoConfig = {
  endpoint: 'https://login.meetball.fun',
  appId: 'uhmy6e6frjsbed2pwni1u',
  scopes: [
    UserScope.Email,
    UserScope.Phone,
    UserScope.CustomData,
  ],

};

export const App = (): JSX.Element => {
  return (
    <LogtoProvider config={config}>
      {/* bolt is fucking stupid and made the questions added to the state in the auth provider */}
      {/* for now I am leaving it here, then later we need to refactor this */}
      {/* by refactor this I mean refactor everything */}
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/signup" element={<SignupFlow />} />
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
            <Route path="/callback" element={<Callback />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </LogtoProvider>
  );
};