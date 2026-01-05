import { ContextPlugin } from "@webiny/api";
import { CmsContext, OnEntryAfterPublishTopicParams } from "@webiny/api-headless-cms/types";
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";

const sfnClient = new SFNClient({ region: process.env.AWS_REGION || "eu-north-1" });

export default new ContextPlugin<CmsContext>(async (context) => {
    // Hook into content lifecycle
    context.cms.onEntryAfterPublish.subscribe(async ({ entry, model }: OnEntryAfterPublishTopicParams) => {
        // Only process blog posts
        if (model.modelId !== "post") {
            return;
        }

        // Skip if already processed by AI
        if (entry.values['postProcessed'] === true) {
            console.log(`Skipping already processed post: ${entry.id}`);
            return;
        }

        console.log(`Content published: ${entry.id}`);

        try {
            // Extract content data
            const payload = {
                entryId: entry.id,
                title: entry.values['postHeadline'] || "",
                description: entry.values['postDescription'] || "",
                content: extractContentText(entry.values['postSections']),
                environment: process.env.WEBINY_ENV || "prod",
                publishedAt: new Date().toISOString(),
            };

            // Get Step Function ARN from AWS Parameter Store
            const stepFunctionArn = process.env.STEP_FUNCTION_ARN;

            if (!stepFunctionArn) {
                throw new Error("STEP_FUNCTION_ARN not configured in Parameter Store");
            }

            // Create a valid execution name (only alphanumeric, hyphens, underscores)
            const sanitizedEntryId = entry.id.replace(/[^a-zA-Z0-9-_]/g, '_');
            const executionName = `post-${sanitizedEntryId}-${Date.now()}`;

            // Start Step Function execution
            const command = new StartExecutionCommand({
                stateMachineArn: stepFunctionArn,
                input: JSON.stringify(payload),
                name: executionName,
            });

            const response = await sfnClient.send(command);

            console.log(
                `Successfully triggered AI pipeline for entry: ${entry.id}`,
                `Execution ARN: ${response.executionArn}`
            );
        } catch (error) {
            console.error(`Failed to trigger AI pipeline for entry ${entry.id}:`, error);
            // Don't throw - allow content to be published even if pipeline fails
            // The content can be manually republished to retry
        }
    });
});

/**
 * Extract plain text from post sections for AI processing
 */
function extractContentText(sections: any[]): string {
    if (!sections || !Array.isArray(sections)) {
        return "";
    }

    return sections
        .map((section) => {
            // Extract markdown content from each section
            return section.postSectionContent || "";
        })
        .join("\n\n")
        .trim();
}
