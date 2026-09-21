import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/Login";
import VerifyLoginOtp from "./pages/VerifyLoginOtp";
import UploadFileToS3 from "./pages/UploadFileToS3";
import { socket } from "./Socket";

const Home = () => {
    useEffect(() => {
        socket.connect();

        socket.on("connect", () => {
            console.log("✅ Socket connected:", socket.id);

            // Join a conversation after socket authentication succeeds
            socket.emit(
                "conversation:join",
                "b9355c23-9e13-4a4e-be13-7d7ff5aa7d0e"
            );
        });

        socket.on("conversation:joined", (data) => {
            console.log("✅ Joined conversation:", data);
        });

        socket.on("conversation:error", (data) => {
            console.error("❌ Conversation error:", data);
        });

        socket.on("connect_error", (error) => {
            console.error(
                "❌ Socket connection error:",
                error.message
            );
        });

        socket.on("disconnect", (reason) => {
            console.log(
                "🔌 Socket disconnected:",
                reason
            );
        });

        return () => {
            socket.off("connect");
            socket.off("conversation:joined");
            socket.off("conversation:error");
            socket.off("connect_error");
            socket.off("disconnect");

            socket.disconnect();
        };
    }, []);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <h1 className="text-4xl font-bold text-blue-600">
                DevSync Realtime Test
            </h1>
        </div>
    );
};

function App() {
    return (
        <Routes>
            <Route
                path="/attachment-test"
                element={
                    <UploadFileToS3
                        conversationId="b9355c23-9e13-4a4e-be13-7d7ff5aa7d0e"
                    />
                }
            />

            <Route
                path="/login"
                element={<Login />}
            />

            <Route
                path="/verify-otp"
                element={<VerifyLoginOtp />}
            />

            <Route
                path="/"
                element={<Home />}
            />

        </Routes>
    );
}

export default App;