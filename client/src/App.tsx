import { Route, Routes } from "react-router-dom";

import Login from "./pages/Login";
import VerifyLoginOtp from "./pages/VerifyLoginOtp";
import UploadFileToS3 from "./pages/UploadFileToS3";
import RealtimeTest from "./pages/RealtimeTest";



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
                element={<RealtimeTest />}
            />

        </Routes>
    );
}

export default App;