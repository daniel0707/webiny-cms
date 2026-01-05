import { createApiApp } from "@webiny/serverless-cms-aws";
import * as aws from "@pulumi/aws";

export default createApiApp({
    pulumiResourceNamePrefix: "wby-",
    pulumi(app) {
        const env = app.params.run.env;
        
        // Add environment variables to the GraphQL Lambda
        app.resources.graphql.functions.graphql.config.environment((envVars) => {
            if (!envVars) {
                envVars = { variables: {} };
            }
            if (!envVars.variables) {
                envVars.variables = {};
            }
            
            // Set WEBINY_ENV and STEP_FUNCTION_ARN based on environment
            const stepFunctionArn = env === "dev"
                ? "arn:aws:states:eu-north-1:730335562143:stateMachine:blog-ai-pipeline-dev"
                : "arn:aws:states:eu-north-1:730335562143:stateMachine:blog-ai-pipeline-prod";
            
            envVars.variables["WEBINY_ENV"] = env;
            envVars.variables["STEP_FUNCTION_ARN"] = stepFunctionArn;
            
            return envVars;
        });

        // Add IAM permission to invoke Step Functions
        new aws.iam.RolePolicy("graphql-sfn-policy", {
            role: app.resources.graphql.role.output.apply(r => r.name),
            policy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [
                    {
                        Effect: "Allow",
                        Action: ["states:StartExecution"],
                        Resource: ["arn:aws:states:eu-north-1:730335562143:stateMachine:*"]
                    }
                ]
            })
        });
    },
    domains({ env }) {
        // Different domains based on environment
        if (env.name === "dev") {
            return {
                domains: ["cms-api-dev.vahla.fi"],
                sslSupportMethod: "sni-only",
                acmCertificateArn:
                    "arn:aws:acm:us-east-1:730335562143:certificate/b3d4ded4-9633-42a8-89a1-d69af4cca9fc"
            };
        }
        if (env.name === "prod") {
            return {
                domains: ["cms-api.vahla.fi"],
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
