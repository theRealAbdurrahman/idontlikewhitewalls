import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AuthProvider } from "./contexts/AuthContext";
import { Home } from "./screens/Home";
import { Events } from "./screens/Events";
import { Messages } from "./screens/Messages";
import { Notifications } from "./screens/Notifications";
import { Profile } from "./screens/Profile";
import { Login } from "./screens/Login";
import { CreateQuestion } from "./screens/CreateQuestion";
import { EventDetails } from "./screens/EventDetails";
import { QuestionDetails } from "./screens/QuestionDetails";
import { UserProfile } from "./screens/UserProfile";
import { Chat } from "./screens/Chat";
import { OfferHelp } from "./screens/OfferHelp";
import { useAuthStore } from "./stores/authStore";

export const App = (): JSX.Element => {
  const { isAuthenticated } = useAuthStore();

  // COMMENTED OUT: Login screen bypass for development
  // if (!isAuthenticated) {
  //   return <Login />;
  // }

  return (
    <AuthProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetails />} />
          <Route path="/questions/:id" element={<QuestionDetails />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/chat/:id" element={<Chat />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:id" element={<UserProfile />} />
          <Route path="/create-question" element={<CreateQuestion />} />
          <Route path="/offer-help/:questionId" element={<OfferHelp />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </Layout>
    </AuthProvider>
  );
};