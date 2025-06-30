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
import { Login } from "./screens/Login";
import { SignupFlow } from "./screens/SignupFlow";
import { Logout } from "./screens/Logout";

// Centralized providers
import { LogtoProvider, LogtoConfig, UserScope } from '@logto/react';
import { AuthProvider, DataProvider, ProtectedRoute } from "./providers";

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
      <AuthProvider>
        <DataProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/signup" element={<SignupFlow />} />
              <Route path="/login" element={<Login />} />
              <Route path="/callback" element={<Callback />} />
              <Route path="/logout" element={<Logout />} />

              {/* Protected routes */}
              <Route path="/home" element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              } />
              <Route path="/events" element={
                <ProtectedRoute>
                  <Events />
                </ProtectedRoute>
              } />
              <Route path="/events/:id" element={
                <ProtectedRoute>
                  <EventDetails />
                </ProtectedRoute>
              } />
              <Route path="/questions/:id" element={
                <ProtectedRoute>
                  <QuestionDetails />
                </ProtectedRoute>
              } />
              <Route path="/messages" element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              } />
              <Route path="/chat/:id" element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              } />
              <Route path="/notifications" element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              } />
              <Route path="/profile/:id" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/create-question" element={
                <ProtectedRoute>
                  <CreateQuestion />
                </ProtectedRoute>
              } />
              <Route path="/create-event" element={
                <ProtectedRoute>
                  <CreateEvent />
                </ProtectedRoute>
              } />
              <Route path="/create-community" element={
                <ProtectedRoute>
                  <CreateCommunity />
                </ProtectedRoute>
              } />
              <Route path="/communities" element={
                <ProtectedRoute>
                  <Communities />
                </ProtectedRoute>
              } />
              <Route path="/suggest-feature" element={
                <ProtectedRoute>
                  <SuggestFeature />
                </ProtectedRoute>
              } />

              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </Layout>
        </DataProvider>
      </AuthProvider>
    </LogtoProvider>
  );
};