import { createCoreApp } from "@webiny/serverless-cms-aws";

export default createCoreApp({
    pulumiResourceNamePrefix: "wby-",
    // VPC (and its NAT Gateway) is overkill for a solo serverless blog.
    // All resources are serverless and communicate via AWS service endpoints;
    // security is enforced entirely through IAM policies.
    vpc: false
});
