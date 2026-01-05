# Content Publish Hook - Deployment Guide

## Overview
The content publish hook triggers an AWS Step Function whenever a new blog post is published in Webiny CMS. The Step Function processes the post with AI to add descriptions and images, then creates a new release with `postProcessed: true`.

## Prerequisites
- AWS Step Function created and running
- Step Function ARN for both dev and prod environments

## Configuration

### 1. Update Step Function ARNs

Edit `apps/api/webiny.application.ts` and replace the placeholder ARNs with your actual Step Function ARNs:

```typescript
app.resources.graphql.functions.api.config.environment((vars) => ({
    ...vars,
    STEP_FUNCTION_ARN:
        app.params.run.env === "dev"
            ? "arn:aws:states:eu-north-1:YOUR_ACCOUNT:stateMachine:YOUR_DEV_NAME"  // ← Replace this
            : "arn:aws:states:eu-north-1:YOUR_ACCOUNT:stateMachine:YOUR_PROD_NAME" // ← Replace this
}));
```

**To find your Step Function ARN:**
```bash
# List Step Functions in your account
aws stepfunctions list-state-machines --region eu-north-1

# Or get specific ARN
aws stepfunctions describe-state-machine \
  --state-machine-name YOUR_STATE_MACHINE_NAME \
  --region eu-north-1 \
  --query 'stateMachineArn'
```

## Deployment

```bash
# Deploy API with the new hook
yarn webiny deploy api --env=dev

# For production
yarn webiny deploy api --env=prod
```

## Testing

### 1. Publish a Post

1. Go to Webiny Admin → Headless CMS → Posts
2. Create or edit a post
3. Ensure `postProcessed` is NOT set to `true`
4. Click "Publish"

### 2. Check CloudWatch Logs

```bash
# View logs
aws logs tail /aws/lambda/wby-graphql-YOUR_ID --follow --region eu-north-1

# Look for these messages:
# - "Content published: 695976465c34cf0002e67d23"
# - "Successfully triggered AI pipeline for entry: ..."
```

### 2. Verify IAM Permissions

The IAM permissions for Step Functions are automatically added by `webiny.application.ts`. You can verify them after deployment:

```bash
# Get the Lambda function name
aws lambda list-functions \
  --query 'Functions[?contains(FunctionName, `wby-graphql`)].FunctionName' \
  --region eu-north-1

# Get the Lambda's role
aws lambda get-function \
  --function-name wby-graphql-YOUR_ID \
  --query 'Configuration.Role' \
  --region eu-north-1

# Check role policies
aws iam list-attached-role-policies \
  --role-name YOUR_ROLE_NAME
```

The `webiny.application.ts` configuration automatically adds:
- `states:StartExecution` permission for Step Functions
- `STEP_FUNCTION_ARN` environment variable

```bash
# List recent executions
aws stepfunctions list-executions \
  --state-machine-arn "arn:aws:states:eu-north-1:ACCOUNT:stateMachine:NAME" \
  --max-results 10 \
  --region eu-north-1

# Get execution details
aws stepfunctions describe-execution \
  --execution-arn "arn:aws:states:..." \
  --region eu-north-1
```

Or use AWS Console:
- AWS Console → Step Functions → State machines
- Select your state machine
- Check "Executions" tab for runs matching `post-{entryId}-{timestamp}`

## How It Works

1. **User publishes post** in Webiny Admin
2. **Hook fires** (`onEntryAfterPublish`)
3. **Checks** if `modelId === "post"` and `postProcessed !== true`
4. **Extracts payload**:
   - `entryId`: Post ID
   - `title`: Post headline
   - `description`: Post description
   - `content`: All post sections joined
   - `environment`: Current env (dev/prod)
   - `publishedAt`: ISO timestamp
5. **Starts Step Function** with payload
6. **Step Function processes**:
   - AI generates improved description
   - AI generates images
   - Creates new revision with `postProcessed: true`
7. **Future publishes** skip processing due to `postProcessed` flag

## Payload Example

```json
{
  "entryId": "695976465c34cf0002e67d23",
  "title": "My Blog Post Title",
  "description": "Original description",
  "content": "Section 1 content\n\nSection 2 content\n\nSection 3 content",
  "environment": "dev",
  "publishedAt": "2026-01-04T14:20:00.000Z"
}
```

## Troubleshooting

### Hook Not Firing

**Check plugin registration:**
```typescript
// In apps/api/graphql/src/index.ts
import contentPublishHook from "./plugins/contentPublishHook";

export const handler = createHandler({
  plugins: [
    // ...
    contentPublishHook,  // Should be before scaffoldsPlugins()
    scaffoldsPlugins(),
    extensions()
  ]
});
```

**Verify model ID:**
- Open Webiny Admin → Settings → Content Models
- Check that "Post" model has ID: `post`

### Parameter Not Found

```bash
# Check parameter exists
aws ssm get-parameter --name "/webiny/dev/STEP_FUNCTION_ARN" --region eu-north-1

# If not found, create it (see "AWS Parameter Store Setup" above)
```

### Permission Denied

**Error: "User is not authorized to perform: states:StartExecution"**

Add IAM policy to Lambda execution role (see "IAM Permissions" above)

### Step Function Fails

**Check execution in AWS Console:**
- Step Functions → Your state machine → Executions
- Click failed execution
- Review each step's input/output
- Check CloudWatch logs for Lambda functions in the state machine

### Already Processed Posts

To reprocess a post:
1. Edit the post in Webiny Admin
2. Set `postProcessed` to `false` (or remove field)
3. Republish

## Monitoring

### CloudWatch Metrics

- Lambda: Invocations, Errors, Duration
- Step Functions: ExecutionsStarted, ExecutionsFailed, ExecutionsSucceeded

### CloudWatch Alarms (Recommended)

```bash
# Create alarm for failed Step Function executions
aws cloudwatch put-metric-alarm \
  --alarm-name "webiny-step-function-failures" \
  --alarm-description "Alert when Step Function fails" \
  --metric-name ExecutionsFailed \
  --namespace AWS/States \
  --statistic Sum \
  --period 300 \
  --threshold 1 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1
```

## Notes

- Hook is non-blocking: Content publishes even if Step Function fails
- Execution names are unique: `post-{entryId}-{timestamp}` (max 43 chars)
- Only posts with `postProcessed !== true` trigger the pipeline
- Manual republishing will retry the pipeline if it previously failed
- All errors are logged to CloudWatch for monitoring
