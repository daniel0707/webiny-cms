import { createAdminApp } from "@webiny/serverless-cms-aws";

export default createAdminApp({
    pulumiResourceNamePrefix: "wby-",
    domains({ env }) {
        // Different domains based on environment
        if (env.name === "dev") {
            return {
                domains: ["cms-admin-dev.vahla.fi"],
                sslSupportMethod: "sni-only",
                acmCertificateArn:
                    "arn:aws:acm:us-east-1:730335562143:certificate/b3d4ded4-9633-42a8-89a1-d69af4cca9fc"
            };
        }
        if (env.name === "prod") {
            return {
                domains: ["cms-admin.vahla.fi"],
                sslSupportMethod: "sni-only",
                acmCertificateArn:
                    "arn:aws:acm:us-east-1:730335562143:certificate/b3d4ded4-9633-42a8-89a1-d69af4cca9fc"
            };
        }

        // Default return if no environment matches
        return {
            domains: [],
            sslSupportMethod: "sni-only",
            acmCertificateArn: ""
        };
    }
});
