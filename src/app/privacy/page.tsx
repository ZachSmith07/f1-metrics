"use client";

import { Box, Container, Typography, Link, ThemeProvider, CssBaseline } from "@mui/material";
import darkTheme from "../theme";
import Navbar from "../components/Navbar";

export default function PrivacyPolicy() {
    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <Navbar />
            <Container maxWidth="md" sx={{ py: 6 }}>
                <Typography variant="h4" gutterBottom fontWeight="bold">
                    Privacy Policy
                </Typography>

                <Typography variant="body2" color="text.secondary" mb={4}>
                    Last Updated: June 20, 2025
                </Typography>

                <Box display="flex" flexDirection="column" gap={3}>
                    <Typography variant="body1">
                        This website is a personal, non-commercial project. It does not collect
                        personally identifiable information directly from users. However, some
                        anonymous usage data may be collected automatically through third-party
                        services.
                    </Typography>

                    <Box>
                        <Typography variant="h6" gutterBottom>
                            What We Collect
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            We may collect:
                        </Typography>

                        <Box component="ul" sx={{ pl: 3, mb: 2 }}>
                            <li>
                                <Typography variant="body1">General usage statistics (via analytics tools)</Typography>
                            </li>
                            <li>
                                <Typography variant="body1">Browser type and operating system</Typography>
                            </li>
                            <li>
                                <Typography variant="body1">Referring websites</Typography>
                            </li>
                            <li>
                                <Typography variant="body1">Approximate location (country-level)</Typography>
                            </li>
                            <li>
                                <Typography variant="body1">Device information</Typography>
                            </li>
                        </Box>
                    </Box>

                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Third-Party Services
                        </Typography>

                        <Typography variant="body1" gutterBottom>
                            We may use services like:
                        </Typography>

                        <Box component="ul" sx={{ pl: 3, mb: 2 }}>
                            <li>
                                <Typography variant="body1">Google Analytics or similar tools</Typography>
                            </li>
                            <li>
                                <Typography variant="body1">Social media embeds (e.g., Twitter, Instagram)</Typography>
                            </li>
                            <li>
                                <Typography variant="body1">Hosting/CDN providers (Vercel)</Typography>
                            </li>
                        </Box>

                        <Typography variant="body1" gutterBottom>
                            These may collect anonymous usage data or set cookies.
                        </Typography>
                    </Box>

                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Your Choices
                        </Typography>


                        <Typography variant="body1" gutterBottom>
                            You can:
                        </Typography>

                        <Box component="ul" sx={{ pl: 3, mb: 2 }}>
                            <li>
                                <Typography variant="body1">Disable cookies in your browser settings</Typography>
                            </li>
                            <li>
                                <Typography variant="body1">Use browser extensions to block tracking</Typography>
                            </li>
                            <li>
                                <Typography variant="body1">Contact us if you have questions or concerns</Typography>
                            </li>
                        </Box>
                    </Box>

                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Contact
                        </Typography>
                        <Typography variant="body1">
                            If you have questions about this policy, contact us at{" "}
                            <Link href="mailto:zach.smith@gmail.com">zach.smith.63044@gmail.com</Link>
                        </Typography>
                    </Box>

                    <Typography variant="caption" color="text.secondary" mt={4}>
                        This site is not affiliated with, maintained, authorized, endorsed, or
                        sponsored by Formula One Group or any of its affiliates. All trademarks
                        are the property of their respective owners.
                    </Typography>
                </Box>
            </Container>
        </ThemeProvider>
    );
}
