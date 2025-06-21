import { Box, Container, Typography, Link, IconButton, Stack } from "@mui/material";
import TwitterIcon from "@mui/icons-material/Twitter";
import InstagramIcon from "@mui/icons-material/Instagram";
import LocalCafeIcon from "@mui/icons-material/LocalCafe";

export default function Footer() {
    return (
        <Box
            component="footer"
            sx={{
                mt: 8,
                py: 4,
                px: 2,
                backgroundColor: "#111", // match your dark theme
                borderTop: "1px solid #333",
            }}
        >
            <Container maxWidth="lg">
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    spacing={2}
                >
                    {/* Left side: copyright */}
                    <Typography variant="body2" color="gray">
                        © {new Date().getFullYear()} F1-Metrics. All rights reserved.
                    </Typography>

                    {/* Center: links */}
                    <Stack direction="row" spacing={2}>
                        <Link href="/privacy" underline="hover" color="gray">
                            Privacy Policy
                        </Link>
                        {/* <Link href="/terms" underline="hover" color="gray">
                            Terms
                        </Link>
                        <Link href="/contact" underline="hover" color="gray">
                            Contact
                        </Link> */}
                    </Stack>

                    {/* Right side: social icons */}
                    <Stack direction="row" spacing={1}>
                        <IconButton
                            component="a"
                            href="https://twitter.com"
                            target="_blank"
                            sx={{ color: "#ccc" }}
                        >
                            <TwitterIcon />
                        </IconButton>
                        <IconButton
                            component="a"
                            href="https://instagram.com"
                            target="_blank"
                            sx={{ color: "#ccc" }}
                        >
                            <InstagramIcon />
                        </IconButton>
                        {/* <IconButton
                            component="a"
                            href="https://www.buymeacoffee.com/yourusername" // swap in your handle
                            target="_blank"
                            aria-label="Buy me a coffee"
                            sx={{ color: "#ccc" }}
                        >
                            <LocalCafeIcon />
                        </IconButton> */}
                    </Stack>
                </Stack>
            </Container>
            <Typography
                variant="caption"
                color="gray"
                textAlign="center"
                display="block"
                mt={2}
            >
                This site is not affiliated with, maintained, authorized, endorsed or sponsored by Formula One Group or any of its affiliates.
                All trademarks are the property of their respective owners.
            </Typography>
        </Box>
    );
}