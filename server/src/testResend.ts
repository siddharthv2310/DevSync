import "dotenv/config";

const testFetch = async () => {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: process.env.TO_EMAIL,
        subject: "DevSync Native Fetch Test",
        html: "<h1>Testing Resend</h1>",
      }),
    });

    console.log("HTTP Status:", response.status);
    console.log("Response:", await response.text());
  } catch (error) {
    console.error("Native fetch error:", error);
  }
};

testFetch();