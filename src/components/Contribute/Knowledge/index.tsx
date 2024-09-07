// src/components/Contribute/Knowledge/index.tsx
'use client';
import React, { useEffect, useMemo, useState } from 'react';
import './knowledge.css';
import { Alert, AlertActionCloseButton } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { ActionGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { Form } from '@patternfly/react-core/dist/dynamic/components/Form';
import { getGitHubUsername } from '../../../utils/github';
import { useSession } from 'next-auth/react';
import AuthorInformation from './AuthorInformation/AuthorInformation';
import KnowledgeInformation from './KnowledgeInformation/KnowledgeInformation';
import FilePathInformation from './FilePathInformation/FilePathInformation';
import DocumentInformation from './DocumentInformation/DocumentInformation';
import AttributionInformation from './AttributionInformation/AttributionInformation';
import Submit from './Submit/Submit';
import { Breadcrumb } from '@patternfly/react-core/dist/dynamic/components/Breadcrumb';
import { BreadcrumbItem } from '@patternfly/react-core/dist/dynamic/components/Breadcrumb';
import { PageBreadcrumb } from '@patternfly/react-core/dist/dynamic/components/Page';
import { PageGroup } from '@patternfly/react-core/dist/dynamic/components/Page';
import { PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';
import { TextContent } from '@patternfly/react-core/dist/dynamic/components/Text';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import KnowledgeDescriptionContent from './KnowledgeDescription/KnowledgeDescriptionContent';
import KnowledgeSeedExample from './KnowledgeSeedExample/KnowledgeSeedExample';
import { checkKnowledgeFormCompletion } from './validation';
import { ValidatedOptions } from '@patternfly/react-core/dist/esm/helpers/constants';
import { DownloadDropdown } from './DownloadDropdown/DownloadDropdown';
import { ViewDropdown } from './ViewDropdown/ViewDropdown';
import Update from './Update/Update';
import { PullRequestFile } from '@/types';
import { Button } from '@patternfly/react-core/dist/esm/components/Button/Button';
import { useRouter } from 'next/navigation';

export interface QuestionAndAnswerPair {
  immutable: boolean;
  question: string;
  isQuestionValid: ValidatedOptions;
  questionValidationError?: string;
  answer: string;
  isAnswerValid: ValidatedOptions;
  answerValidationError?: string;
}

export interface SeedExample {
  immutable: boolean;
  isExpanded: boolean;
  context: string;
  isContextValid: ValidatedOptions;
  validationError?: string;
  questionAndAnswers: QuestionAndAnswerPair[];
}

export interface KnowledgeFormData {
  email: string;
  name: string;
  submissionSummary: string;
  domain: string;
  documentOutline: string;
  filePath: string;
  seedExamples: SeedExample[];
  knowledgeDocumentRepositoryUrl: string;
  knowledgeDocumentCommit: string;
  documentName: string;
  titleWork: string;
  linkWork: string;
  revision: string;
  licenseWork: string;
  creators: string;
}

export interface KnowledgeEditFormData {
  isEditForm: boolean;
  knowledgeVersion: number;
  pullRequestNumber: number;
  branchName: string;
  yamlFile: PullRequestFile;
  attributionFile: PullRequestFile;
  knowledgeFormData: KnowledgeFormData;
}

export interface ActionGroupAlertContent {
  title: string;
  message: string;
  url?: string;
  success: boolean;
}

export interface KnowledgeFormProps {
  knowledgeEditFormData?: KnowledgeEditFormData;
}

export const KnowledgeForm: React.FunctionComponent<KnowledgeFormProps> = ({ knowledgeEditFormData }) => {
  const { data: session } = useSession();
  const [githubUsername, setGithubUsername] = useState<string>('');
  // Author Information
  const [email, setEmail] = useState<string>('');
  const [name, setName] = useState<string>('');

  // Knowledge Information
  const [submissionSummary, setSubmissionSummary] = useState<string>('');
  const [domain, setDomain] = useState<string>('');
  const [documentOutline, setDocumentOutline] = useState<string>('');

  // File Path Information
  const [filePath, setFilePath] = useState<string>('');

  const [knowledgeDocumentRepositoryUrl, setKnowledgeDocumentRepositoryUrl] = useState<string>('');
  const [knowledgeDocumentCommit, setKnowledgeDocumentCommit] = useState<string>('');
  // This used to be 'patterns' but I am not totally sure what this variable actually is...
  const [documentName, setDocumentName] = useState<string>('');

  // Attribution Information
  // State
  const [titleWork, setTitleWork] = useState<string>('');
  const [linkWork, setLinkWork] = useState<string>('');
  const [revision, setRevision] = useState<string>('');
  const [licenseWork, setLicenseWork] = useState<string>('');
  const [creators, setCreators] = useState<string>('');

  const [actionGroupAlertContent, setActionGroupAlertContent] = useState<ActionGroupAlertContent | undefined>();

  const [disableAction, setDisableAction] = useState<boolean>(true);
  const [reset, setReset] = useState<boolean>(false);

  const router = useRouter();

  const emptySeedExample: SeedExample = {
    immutable: true,
    isExpanded: false,
    context: '',
    isContextValid: ValidatedOptions.default,
    questionAndAnswers: [
      {
        immutable: true,
        question: '',
        isQuestionValid: ValidatedOptions.default,
        answer: '',
        isAnswerValid: ValidatedOptions.default
      },
      {
        immutable: true,
        question: '',
        isQuestionValid: ValidatedOptions.default,
        answer: '',
        isAnswerValid: ValidatedOptions.default
      },
      {
        immutable: true,
        question: '',
        isQuestionValid: ValidatedOptions.default,
        answer: '',
        isAnswerValid: ValidatedOptions.default
      }
    ]
  };

  const [seedExamples, setSeedExamples] = useState<SeedExample[]>([
    emptySeedExample,
    emptySeedExample,
    emptySeedExample,
    emptySeedExample,
    emptySeedExample
  ]);

  useMemo(() => {
    const fetchUsername = async () => {
      if (session?.accessToken) {
        try {
          const fetchedUsername = await getGitHubUsername(session.accessToken);
          setGithubUsername(fetchedUsername);
        } catch (error) {
          console.error('Failed to fetch GitHub username:', error);
        }
      }
    };

    fetchUsername();
  }, [session?.accessToken]);

  useEffect(() => {
    // Set all elements from the knowledgeFormData to the state
    if (knowledgeEditFormData) {
      setEmail(knowledgeEditFormData.knowledgeFormData.email);
      setName(knowledgeEditFormData.knowledgeFormData.name);
      setSubmissionSummary(knowledgeEditFormData.knowledgeFormData.submissionSummary);
      setDomain(knowledgeEditFormData.knowledgeFormData.domain);
      setDocumentOutline(knowledgeEditFormData.knowledgeFormData.documentOutline);
      setFilePath(knowledgeEditFormData.knowledgeFormData.filePath);
      setKnowledgeDocumentRepositoryUrl(knowledgeEditFormData.knowledgeFormData.knowledgeDocumentRepositoryUrl);
      setKnowledgeDocumentCommit(knowledgeEditFormData.knowledgeFormData.knowledgeDocumentCommit);
      setDocumentName(knowledgeEditFormData.knowledgeFormData.documentName);
      setTitleWork(knowledgeEditFormData.knowledgeFormData.titleWork);
      setLinkWork(knowledgeEditFormData.knowledgeFormData.linkWork);
      setRevision(knowledgeEditFormData.knowledgeFormData.revision);
      setLicenseWork(knowledgeEditFormData.knowledgeFormData.licenseWork);
      setCreators(knowledgeEditFormData.knowledgeFormData.creators);
      setSeedExamples(knowledgeEditFormData.knowledgeFormData.seedExamples);
    }
  }, [knowledgeEditFormData]);

  const validateContext = (context: string): ValidatedOptions => {
    if (context.length > 0 && context.length < 500) {
      setDisableAction(!checkKnowledgeFormCompletion(knowledgeFormData));
      return ValidatedOptions.success;
    }
    setDisableAction(true);
    return ValidatedOptions.error;
  };

  const validateQuestion = (question: string): ValidatedOptions => {
    if (question.length > 0 && question.length < 250) {
      setDisableAction(!checkKnowledgeFormCompletion(knowledgeFormData));
      return ValidatedOptions.success;
    }
    setDisableAction(true);
    return ValidatedOptions.error;
  };

  const validateAnswer = (answer: string): ValidatedOptions => {
    if (answer.length > 0 && answer.length < 250) {
      setDisableAction(!checkKnowledgeFormCompletion(knowledgeFormData));
      return ValidatedOptions.success;
    }
    setDisableAction(true);
    return ValidatedOptions.error;
  };

  const handleContextInputChange = (seedExampleIndex: number, contextValue: string): void => {
    setSeedExamples(
      seedExamples.map((seedExample: SeedExample, index: number) =>
        index === seedExampleIndex
          ? {
              ...seedExample,
              context: contextValue
            }
          : seedExample
      )
    );
  };

  const handleContextBlur = (seedExampleIndex: number): void => {
    setSeedExamples(
      seedExamples.map((seedExample: SeedExample, index: number) =>
        index === seedExampleIndex
          ? {
              ...seedExample,
              isContextValid: validateContext(seedExample.context)
            }
          : seedExample
      )
    );
  };

  const handleQuestionInputChange = (seedExampleIndex: number, questionAndAnswerIndex: number, questionValue: string): void => {
    setSeedExamples(
      seedExamples.map((seedExample: SeedExample, index: number) =>
        index === seedExampleIndex
          ? {
              ...seedExample,
              questionAndAnswers: seedExample.questionAndAnswers.map((questionAndAnswerPair: QuestionAndAnswerPair, index: number) =>
                index === questionAndAnswerIndex
                  ? {
                      ...questionAndAnswerPair,
                      question: questionValue
                    }
                  : questionAndAnswerPair
              )
            }
          : seedExample
      )
    );
  };

  const handleQuestionBlur = (seedExampleIndex: number, questionAndAnswerIndex: number): void => {
    setSeedExamples(
      seedExamples.map((seedExample: SeedExample, index: number) =>
        index === seedExampleIndex
          ? {
              ...seedExample,
              questionAndAnswers: seedExample.questionAndAnswers.map((questionAndAnswerPair: QuestionAndAnswerPair, index: number) =>
                index === questionAndAnswerIndex
                  ? {
                      ...questionAndAnswerPair,
                      isQuestionValid: validateQuestion(questionAndAnswerPair.question)
                    }
                  : questionAndAnswerPair
              )
            }
          : seedExample
      )
    );
  };

  const handleAnswerInputChange = (seedExampleIndex: number, questionAndAnswerIndex: number, answerValue: string): void => {
    setSeedExamples(
      seedExamples.map((seedExample: SeedExample, index: number) =>
        index === seedExampleIndex
          ? {
              ...seedExample,
              questionAndAnswers: seedExample.questionAndAnswers.map((questionAndAnswerPair: QuestionAndAnswerPair, index: number) =>
                index === questionAndAnswerIndex
                  ? {
                      ...questionAndAnswerPair,
                      answer: answerValue
                    }
                  : questionAndAnswerPair
              )
            }
          : seedExample
      )
    );
  };

  const handleAnswerBlur = (seedExampleIndex: number, questionAndAnswerIndex: number): void => {
    setSeedExamples(
      seedExamples.map((seedExample: SeedExample, index: number) =>
        index === seedExampleIndex
          ? {
              ...seedExample,
              questionAndAnswers: seedExample.questionAndAnswers.map((questionAndAnswerPair: QuestionAndAnswerPair, index: number) =>
                index === questionAndAnswerIndex
                  ? {
                      ...questionAndAnswerPair,
                      isAnswerValid: validateAnswer(questionAndAnswerPair.answer)
                    }
                  : questionAndAnswerPair
              )
            }
          : seedExample
      )
    );
  };

  // New function to handle the button click and generate Q&A pairs
  const handleGenerateQA = async (seedExampleIndex: number) => {
    try {
      // Ensure seedExampleIndex is valid
      if (seedExampleIndex < 0 || seedExampleIndex >= seedExamples.length) {
        throw new Error('Invalid seed example index');
      }

      const context = seedExamples[seedExampleIndex].context;
      const prompt = `Generate 3 question and answer pairs from the provided context. The output should be in the form of "Question 1" and "Answer 1" and next "Question 2" and "Answer 2" and so on. Here is the context:\n${context}`;

      // Make a request to the server-side route
      const response = await fetch('/api/pr/qnaGen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question: prompt, systemRole: 'user' })
      });

      if (!response.ok) {
        throw new Error('Failed to generate Q&A pairs');
      }

      const data = await response.json();

      // Parse the response to extract Q&A pairs
      const updatedQAPairs = seedExamples[seedExampleIndex].questionAndAnswers.map((qaPair, i) => {
        const questionMatch = data.match(new RegExp(`Question ${i + 1}: (.*?)(?:Answer|$)`));
        const answerMatch = data.match(new RegExp(`Answer ${i + 1}: (.*?)(?:Question|$)`));

        return {
          ...qaPair,
          question: questionMatch ? questionMatch[1].trim() : qaPair.question,
          answer: answerMatch ? answerMatch[1].trim() : qaPair.answer
        };
      });

      // Update state with new Q&A pairs
      setSeedExamples(seedExamples.map((example, i) => (i === seedExampleIndex ? { ...example, questionAndAnswers: updatedQAPairs } : example)));
    } catch (error) {
      console.error('Error generating Q&A pairs:', error);
    }
  };

  const onCloseActionGroupAlert = () => {
    setActionGroupAlertContent(undefined);
  };

  const resetForm = (): void => {
    setEmail('');
    setName('');
    setDocumentOutline('');
    setSubmissionSummary('');
    setDomain('');
    setKnowledgeDocumentRepositoryUrl('');
    setKnowledgeDocumentCommit('');
    setDocumentName('');
    setTitleWork('');
    setLinkWork('');
    setLicenseWork('');
    setCreators('');
    setRevision('');
    setFilePath('');
    setSeedExamples([emptySeedExample, emptySeedExample, emptySeedExample, emptySeedExample, emptySeedExample]);
    setDisableAction(true);

    // setReset is just reset button, value has no impact.
    setReset(reset ? false : true);
  };

  const knowledgeFormData: KnowledgeFormData = {
    email: email,
    name: name,
    submissionSummary: submissionSummary,
    domain: domain,
    documentOutline: documentOutline,
    filePath: filePath,
    seedExamples: seedExamples,
    knowledgeDocumentRepositoryUrl: knowledgeDocumentRepositoryUrl,
    knowledgeDocumentCommit: knowledgeDocumentCommit,
    documentName: documentName,
    titleWork: titleWork,
    linkWork: linkWork,
    revision: revision,
    licenseWork: licenseWork,
    creators: creators
  };

  useEffect(() => {
    setDisableAction(!checkKnowledgeFormCompletion(knowledgeFormData));
  }, [knowledgeFormData]);

  const handleCancel = () => {
    router.push('/dashboard');
  };

  return (
    <PageGroup>
      <PageBreadcrumb>
        <Breadcrumb>
          <BreadcrumbItem to="/"> Home </BreadcrumbItem>
          <BreadcrumbItem isActive>Knowledge Contribution</BreadcrumbItem>
        </Breadcrumb>
      </PageBreadcrumb>

      <PageSection style={{ backgroundColor: 'white' }}>
        <Title headingLevel="h1" size="2xl" style={{ paddingTop: '10' }}>
          Knowledge Contribution
        </Title>
        <TextContent>
          <KnowledgeDescriptionContent />
        </TextContent>
        <Form className="form-k">
          <AuthorInformation
            reset={reset}
            knowledgeFormData={knowledgeFormData}
            setDisableAction={setDisableAction}
            email={email}
            setEmail={setEmail}
            name={name}
            setName={setName}
          />

          <KnowledgeInformation
            reset={reset}
            isEditForm={knowledgeEditFormData?.isEditForm}
            knowledgeFormData={knowledgeFormData}
            setDisableAction={setDisableAction}
            submissionSummary={submissionSummary}
            setSubmissionSummary={setSubmissionSummary}
            domain={domain}
            setDomain={setDomain}
            documentOutline={documentOutline}
            setDocumentOutline={setDocumentOutline}
          />

          <FilePathInformation
            reset={reset}
            path={knowledgeEditFormData ? knowledgeEditFormData.knowledgeFormData.filePath : filePath}
            setFilePath={setFilePath}
          />

          {/* Iterate over each seed example and display it */}
          {seedExamples.map((seedExample, index) => (
            <div key={index}>
              <KnowledgeSeedExample
                seedExamples={[seedExample]} // Pass each individual seed example
                handleContextInputChange={(contextValue) => handleContextInputChange(index, contextValue)}
                handleContextBlur={() => handleContextBlur(index)}
                handleQuestionInputChange={(qaIndex, questionValue) => handleQuestionInputChange(index, qaIndex, questionValue)}
                handleQuestionBlur={(qaIndex) => handleQuestionBlur(index, qaIndex)}
                handleAnswerInputChange={(qaIndex, answerValue) => handleAnswerInputChange(index, qaIndex, answerValue)}
                handleAnswerBlur={(qaIndex) => handleAnswerBlur(index, qaIndex)}
              />

              {/* New Button to Generate Q&A Pairs for each seed example */}
              <Button variant="primary" onClick={() => handleGenerateQA(index)}>
                Generate Q&A Pairs
              </Button>
            </div>
          ))}

          <DocumentInformation
            reset={reset}
            isEditForm={knowledgeEditFormData?.isEditForm}
            knowledgeFormData={knowledgeFormData}
            setDisableAction={setDisableAction}
            knowledgeDocumentRepositoryUrl={knowledgeDocumentRepositoryUrl}
            setKnowledgeDocumentRepositoryUrl={setKnowledgeDocumentRepositoryUrl}
            knowledgeDocumentCommit={knowledgeDocumentCommit}
            setKnowledgeDocumentCommit={setKnowledgeDocumentCommit}
            documentName={documentName}
            setDocumentName={setDocumentName}
          />

          <AttributionInformation
            reset={reset}
            isEditForm={knowledgeEditFormData?.isEditForm}
            knowledgeFormData={knowledgeFormData}
            setDisableAction={setDisableAction}
            titleWork={titleWork}
            setTitleWork={setTitleWork}
            linkWork={linkWork}
            setLinkWork={setLinkWork}
            revision={revision}
            setRevision={setRevision}
            licenseWork={licenseWork}
            setLicenseWork={setLicenseWork}
            creators={creators}
            setCreators={setCreators}
          />

          {actionGroupAlertContent && (
            <Alert
              variant={actionGroupAlertContent.success ? 'success' : 'danger'}
              title={actionGroupAlertContent.title}
              timeout={10000}
              onTimeout={onCloseActionGroupAlert}
              actionClose={<AlertActionCloseButton onClose={onCloseActionGroupAlert} />}
            >
              <p>
                {actionGroupAlertContent.message}
                <br />
                {actionGroupAlertContent.success && actionGroupAlertContent.url && actionGroupAlertContent.url.trim().length > 0 && (
                  <a href={actionGroupAlertContent.url} target="_blank" rel="noreferrer">
                    View your pull request
                  </a>
                )}
              </p>
            </Alert>
          )}

          <ActionGroup>
            {knowledgeEditFormData?.isEditForm && (
              <Update
                disableAction={disableAction}
                knowledgeFormData={knowledgeFormData}
                pullRequestNumber={knowledgeEditFormData.pullRequestNumber}
                setActionGroupAlertContent={setActionGroupAlertContent}
                yamlFile={knowledgeEditFormData.yamlFile}
                attributionFile={knowledgeEditFormData.attributionFile}
                branchName={knowledgeEditFormData.branchName}
              />
            )}
            {!knowledgeEditFormData?.isEditForm && (
              <Submit
                disableAction={disableAction}
                knowledgeFormData={knowledgeFormData}
                setActionGroupAlertContent={setActionGroupAlertContent}
                githubUsername={githubUsername}
                resetForm={resetForm}
              />
            )}
            <DownloadDropdown
              disableAction={disableAction}
              knowledgeFormData={knowledgeFormData}
              setActionGroupAlertContent={setActionGroupAlertContent}
              githubUsername={githubUsername}
            />
            <ViewDropdown disableAction={disableAction} knowledgeFormData={knowledgeFormData} githubUsername={githubUsername} />
            <Button variant="link" type="button" onClick={handleCancel}>
              Cancel
            </Button>
          </ActionGroup>
        </Form>
      </PageSection>
    </PageGroup>
  );
};

export default KnowledgeForm;
