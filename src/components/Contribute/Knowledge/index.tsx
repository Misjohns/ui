// src/components/Contribute/Knowledge/index.tsx
'use client';
import React, { useEffect, useState } from 'react';
import './knowledge.css';
import { Alert, AlertActionLink, AlertActionCloseButton } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { ActionGroup, FormFieldGroupExpandable, FormFieldGroupHeader } from '@patternfly/react-core/dist/dynamic/components/Form';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Text } from '@patternfly/react-core/dist/dynamic/components/Text';
import { TextInput } from '@patternfly/react-core/dist/dynamic/components/TextInput';
import { Form } from '@patternfly/react-core/dist/dynamic/components/Form';
import { FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { TextArea } from '@patternfly/react-core/dist/dynamic/components/TextArea';
import { PlusIcon, MinusCircleIcon, CodeIcon } from '@patternfly/react-icons/dist/dynamic/icons/';
import yaml from 'js-yaml';
import { validateFields, validateEmail, validateUniqueItems } from '../../../utils/validation';
import { getGitHubUsername, fetchKnowledgeFileContent } from '../../../utils/github';
import { useSession } from 'next-auth/react';
import YamlCodeModal from '../../YamlCodeModal';
import { UploadFile } from './UploadFile';
import FileSelectionModal from './FileSelectionModal';
import { SchemaVersion } from '@/types';
import KnowledgeDescription from './KnowledgeDescription';

export const KnowledgeForm: React.FunctionComponent = () => {
  const { data: session } = useSession();
  const [githubUsername, setGithubUsername] = useState<string | null>(null);

  useEffect(() => {
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

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [task_description, setTaskDescription] = useState('');
  const [submission_summary, setSubmissionSummary] = useState('');
  const [domain, setDomain] = useState('');

  const [repo, setRepo] = useState('');
  const [commit, setCommit] = useState('');
  const [patterns, setPatterns] = useState('');

  const [title_work, setTitleWork] = useState('');
  const [link_work, setLinkWork] = useState('');
  const [revision, setRevision] = useState('');
  const [license_work, setLicenseWork] = useState('');
  const [creators, setCreators] = useState('');

  const [questions, setQuestions] = useState<string[]>(new Array(5).fill(''));
  const [answers, setAnswers] = useState<string[]>(new Array(5).fill(''));
  const [isSuccessAlertVisible, setIsSuccessAlertVisible] = useState(false);
  const [isFailureAlertVisible, setIsFailureAlertVisible] = useState(false);

  const [failure_alert_title, setFailureAlertTitle] = useState('');
  const [failure_alert_message, setFailureAlertMessage] = useState<string>('');

  const [success_alert_title, setSuccessAlertTitle] = useState('');
  const [success_alert_message, setSuccessAlertMessage] = useState<React.ReactNode>('');
  const [successAlertLink, setSuccessAlertLink] = useState<string>('');

  const [useFileUpload, setUseFileUpload] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  const [isYamlModalOpen, setIsYamlModalOpen] = useState(false);
  const [isFileSelectionModalOpen, setIsFileSelectionModalOpen] = useState(false);
  const [yamlContent, setYamlContent] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [conversionMessage, setConversionMessage] = useState('');

  const handleInputChange = (index: number, type: string, value: string) => {
    switch (type) {
      case 'question':
        setQuestions((prevQuestions) => {
          const updatedQuestions = [...prevQuestions];
          updatedQuestions[index] = value;
          return updatedQuestions;
        });
        break;
      case 'answer':
        setAnswers((prevAnswers) => {
          const updatedAnswers = [...prevAnswers];
          updatedAnswers[index] = value;
          return updatedAnswers;
        });
        break;
      default:
        break;
    }
  };

  const addQuestionAnswerPair = () => {
    setQuestions([...questions, '']);
    setAnswers([...answers, '']);
  };

  const deleteQuestionAnswerPair = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
    setAnswers(answers.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setEmail('');
    setName('');
    setTaskDescription('');
    setSubmissionSummary('');
    setDomain('');
    setQuestions(new Array(5).fill(''));
    setAnswers(new Array(5).fill(''));
    setRepo('');
    setCommit('');
    setPatterns('');
    setTitleWork('');
    setLinkWork('');
    setLicenseWork('');
    setCreators('');
    setRevision('');
    setUploadedFiles([]);
    setSelectedFiles([]);
  };

  const onCloseSuccessAlert = () => {
    setIsSuccessAlertVisible(false);
    setIsConverting(false);
  };

  const onCloseFailureAlert = () => {
    setIsFailureAlertVisible(false);
    setIsConverting(false);
  };

  const handleFilesChange = (files: File[]) => {
    setUploadedFiles(files);
    setPatterns(files.map((file) => file.name).join(', ')); // Populate the patterns field
  };

  const handleSelectFiles = async (files: string[]) => {
    console.log('Selected files:', files); // Log selected files

    try {
      const downloadedFiles = await Promise.all(
        files.map(async (filePath) => {
          console.log('Fetching file content for:', filePath); // Log each file path before fetching
          const fileBlob = await fetchKnowledgeFileContent(session!.accessToken as string, githubUsername!, filePath);
          console.log('Fetched file blob:', fileBlob); // Log the fetched content

          const file = new File([fileBlob], filePath.split('/').pop()!, { type: fileBlob.type });
          console.log('Created file:', file); // Log the created file
          return file;
        })
      );

      console.log('Downloaded files:', downloadedFiles);

      const pdfFiles = downloadedFiles.filter((file) => file.type === 'application/pdf' || file.name.endsWith('.pdf'));
      const otherFiles = downloadedFiles.filter((file) => file.type !== 'application/pdf' && !file.name.endsWith('.pdf'));

      console.log('PDF files:', pdfFiles);
      console.log('Other files:', otherFiles);

      // Handle PDF conversion
      if (pdfFiles.length > 0) {
        const pdfFilesBase64 = await Promise.all(
          pdfFiles.map(
            (file) =>
              new Promise<{ fileName: string; fileContent: string }>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                  console.log('File read as base64:', e.target!.result); // Log base64 content
                  resolve({
                    fileName: file.name,
                    fileContent: (e.target!.result as string).split(',')[1] // Extract base64 content
                  });
                };
                reader.onerror = (error) => {
                  console.error('Error reading file as base64:', error);
                  reject(error);
                };
                reader.readAsDataURL(file);
              })
          )
        );

        console.log('Base64 encoded PDF files:', pdfFilesBase64);

        const pdfUploadResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ files: pdfFilesBase64 })
        });

        const pdfUploadResult = await pdfUploadResponse.json();
        if (!pdfUploadResponse.ok) {
          throw new Error(pdfUploadResult.error || 'Failed to upload PDF files');
        }

        console.log('PDF upload result:', pdfUploadResult);

        const conversionResponse = await fetch('/api/conversion', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ repoUrl: pdfUploadResult.repoUrl, documentNames: pdfUploadResult.documentNames })
        });

        const conversionResult = await conversionResponse.json();
        if (!conversionResponse.ok) {
          throw new Error(conversionResult.error || 'Failed to convert PDF');
        }

        console.log('PDF conversion result:', conversionResult);

        const mdFileUrl = conversionResult.md_file_url;
        const mdFileResponse = await fetch(mdFileUrl);
        const mdFileContent = await mdFileResponse.text();

        console.log('Converted Markdown file content:', mdFileContent);

        otherFiles.push(new File([mdFileContent], pdfFiles[0].name.replace('.pdf', '.md'), { type: 'text/markdown' }));
      }

      const updatedFiles = otherFiles.reduce(
        (acc, file) => {
          const index = acc.findIndex((f) => f.name === file.name);
          if (index !== -1) {
            acc[index] = file; // Overwrite existing file
          } else {
            acc.push(file);
          }
          return acc;
        },
        [...uploadedFiles]
      );

      setUploadedFiles(updatedFiles);
      console.log('Successfully read file count:', downloadedFiles.length);
      console.log('Current files:', updatedFiles);
    } catch (error) {
      console.error('Error fetching file content:', error);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLButtonElement>) => {
    event.preventDefault();

    const infoFields = { email, name, task_description, submission_summary, domain, repo, commit, patterns };
    const attributionFields = { title_work, link_work, revision, license_work, creators };

    let validation = validateFields(infoFields);
    if (!validation.valid) {
      setFailureAlertTitle('Something went wrong!');
      setFailureAlertMessage(validation.message);
      setIsFailureAlertVisible(true);
      return;
    }

    validation = validateFields(attributionFields);
    if (!validation.valid) {
      setFailureAlertTitle('Something went wrong!');
      setFailureAlertMessage(validation.message);
      setIsFailureAlertVisible(true);
      return;
    }

    validation = validateEmail(email);
    if (!validation.valid) {
      setFailureAlertTitle('Something went wrong!');
      setFailureAlertMessage(validation.message);
      setIsFailureAlertVisible(true);
      return;
    }

    validation = validateUniqueItems(questions, 'questions');
    if (!validation.valid) {
      setFailureAlertTitle('Something went wrong!');
      setFailureAlertMessage(validation.message);
      setIsFailureAlertVisible(true);
      return;
    }

    validation = validateUniqueItems(answers, 'answers');
    if (!validation.valid) {
      setFailureAlertTitle('Something went wrong!');
      setFailureAlertMessage(validation.message);
      setIsFailureAlertVisible(true);
      return;
    }

    const knowledgeData = {
      name: name,
      email: email,
      task_description: task_description,
      submission_summary: submission_summary,
      domain: domain,
      repo: repo,
      commit: commit,
      patterns: patterns,
      title_work: title_work,
      link_work: link_work,
      revision: revision,
      license_work: license_work,
      creators: creators,
      questions,
      answers
    };

    try {
      const response = await fetch('/api/pr/knowledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(knowledgeData)
      });

      if (!response.ok) {
        throw new Error('Failed to submit knowledge data');
      }

      const result = await response.json();
      setSuccessAlertTitle('Knowledge contribution submitted successfully!');
      setSuccessAlertMessage('A pull request containing your knowledge submission has been successfully created.');
      setSuccessAlertLink(result.html_url);
      setIsSuccessAlertVisible(true);
      resetForm();
    } catch (error: unknown) {
      if (error instanceof Error) {
        setFailureAlertTitle('Failed to submit your Knowledge contribution');
        setFailureAlertMessage(error.message);
        setIsFailureAlertVisible(true);
      }
    }
  };

  const handleDocumentUpload = async () => {
    if (uploadedFiles.length > 0) {
      setIsConverting(true);
      setConversionMessage('Files are being processed...');

      const fileContents: { fileName: string; fileContent: string; fileType: string }[] = [];
      const markdownFiles: { fileName: string; fileContent: string }[] = [];
      const pdfFiles: { fileName: string; fileContent: string }[] = [];

      await Promise.all(
        uploadedFiles.map(
          (file) =>
            new Promise<void>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                const fileContent = e.target!.result as string;
                const fileType = file.type;

                if (fileType === 'application/pdf') {
                  // For PDF files, extract base64 content
                  pdfFiles.push({
                    fileName: file.name,
                    fileContent: fileContent.split(',')[1]
                  });
                } else {
                  // For Markdown and other text files, use the full content
                  markdownFiles.push({
                    fileName: file.name,
                    fileContent
                  });
                }
                resolve();
              };
              reader.onerror = reject;

              if (file.type === 'application/pdf') {
                reader.readAsDataURL(file); // Read PDF files as base64
              } else {
                reader.readAsText(file); // Read Markdown and other files as text
              }
            })
        )
      );

      try {
        // Upload PDF files for conversion
        if (pdfFiles.length > 0) {
          const pdfUploadResponse = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ files: pdfFiles })
          });

          const pdfUploadResult = await pdfUploadResponse.json();
          if (!pdfUploadResponse.ok) {
            throw new Error(pdfUploadResult.error || 'Failed to upload PDF files');
          }

          const conversionResponse = await fetch('/api/conversion', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ repoUrl: pdfUploadResult.repoUrl, documentNames: pdfUploadResult.documentNames })
          });

          const conversionResult = await conversionResponse.json();
          if (!conversionResponse.ok) {
            throw new Error(conversionResult.error || 'Failed to convert PDF');
          }

          const mdFileUrl = conversionResult.md_file_url;

          // Download the converted Markdown file
          const mdFileResponse = await fetch(mdFileUrl);
          const mdFileContent = await mdFileResponse.text();

          // Add converted Markdown to the list of Markdown files
          markdownFiles.push({
            fileName: pdfFiles[0].fileName.replace('.pdf', '.md'),
            fileContent: mdFileContent
          });
        }

        // Upload all Markdown files in a single commit
        if (markdownFiles.length > 0) {
          const markdownUploadResponse = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ files: markdownFiles })
          });

          const markdownUploadResult = await markdownUploadResponse.json();
          if (!markdownUploadResponse.ok) {
            throw new Error(markdownUploadResult.error || 'Failed to upload Markdown files');
          }

          setRepo(markdownUploadResult.repoUrl);
          setCommit(markdownUploadResult.commitSha);
          setPatterns(markdownUploadResult.documentNames.join(', ')); // Populate the patterns field
          console.log('Markdown files uploaded:', markdownUploadResult.documentNames);

          setSuccessAlertTitle('Document uploaded successfully!');
          setSuccessAlertMessage('Documents have been uploaded to your repo to be referenced in the knowledge submission.');
          setSuccessAlertLink(markdownUploadResult.prUrl);
          setIsSuccessAlertVisible(true);
          setUseFileUpload(false); // Switch back to manual mode to display the newly created values in the knowledge submission
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          setFailureAlertTitle('Failed to upload document');
          setFailureAlertMessage(error.message);
          setIsFailureAlertVisible(true);
        }
      } finally {
        setIsConverting(false);
      }
    }
  };

  const handleDownloadYaml = () => {
    const infoFields = { email, name, task_description, submission_summary: submission_summary, domain, repo, commit, patterns };
    const attributionFields = { title_work, link_work, revision, license_work, creators };

    let validation = validateFields(infoFields);
    if (!validation.valid) {
      setFailureAlertTitle('Something went wrong!');
      setFailureAlertMessage(validation.message);
      setIsFailureAlertVisible(true);
      return;
    }

    validation = validateFields(attributionFields);
    if (!validation.valid) {
      setFailureAlertTitle('Something went wrong!');
      setFailureAlertMessage(validation.message);
      setIsFailureAlertVisible(true);
      return;
    }

    validation = validateEmail(email);
    if (!validation.valid) {
      setFailureAlertTitle('Something went wrong!');
      setFailureAlertMessage(validation.message);
      setIsFailureAlertVisible(true);
      return;
    }

    validation = validateUniqueItems(questions, 'questions');
    if (!validation.valid) {
      setFailureAlertTitle('Something went wrong!');
      setFailureAlertMessage(validation.message);
      setIsFailureAlertVisible(true);
      return;
    }

    validation = validateUniqueItems(answers, 'answers');
    if (!validation.valid) {
      setFailureAlertTitle('Something went wrong!');
      setFailureAlertMessage(validation.message);
      setIsFailureAlertVisible(true);
      return;
    }

    interface SeedExample {
      question: string;
      answer: string;
    }

    const yamlData = {
      created_by: githubUsername,
      version: SchemaVersion,
      domain: domain,
      task_description: task_description,
      seed_examples: questions.map(
        (question: string, index: number): SeedExample => ({
          question,
          answer: answers[index]
        })
      ),
      document: {
        repo: repo,
        commit: commit,
        patterns: patterns.split(',').map((pattern: string) => pattern.trim())
      }
    };

    const yamlString = yaml.dump(yamlData, { lineWidth: -1 });
    const blob = new Blob([yamlString], { type: 'application/x-yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'knowledge.yaml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadAttribution = () => {
    const attributionFields = { title_work, link_work, revision: submission_summary, license_work, creators };

    const validation = validateFields(attributionFields);
    if (!validation.valid) {
      setFailureAlertTitle('Something went wrong!');
      setFailureAlertMessage(validation.message);
      setIsFailureAlertVisible(true);
      return;
    }

    const attributionContent = `Title of work: ${title_work}
Link to work: ${link_work}
Revision: ${submission_summary}
License of the work: ${license_work}
Creator names: ${creators}
`;

    const blob = new Blob([attributionContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attribution.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleViewYaml = () => {
    const yamlData = {
      created_by: githubUsername,
      version: SchemaVersion,
      domain: domain,
      task_description: task_description,
      seed_examples: questions.map((question, index) => ({
        question,
        answer: answers[index]
      })),
      document: {
        repo: repo,
        commit: commit,
        patterns: patterns.split(',').map((pattern) => pattern.trim())
      }
    };

    const yamlString = yaml.dump(yamlData, { lineWidth: -1 });
    setYamlContent(yamlString);
    setIsYamlModalOpen(true);
  };

  return (
    <Form className="form-k">
      <YamlCodeModal isModalOpen={isYamlModalOpen} handleModalToggle={() => setIsYamlModalOpen(!isYamlModalOpen)} yamlContent={yamlContent} />
      <FileSelectionModal
        isOpen={isFileSelectionModalOpen}
        onClose={() => setIsFileSelectionModalOpen(false)}
        onSelectFiles={handleSelectFiles}
        repoName={repo}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <FormFieldGroupHeader titleText={{ text: 'Knowledge Contribution Form', id: 'knowledge-contribution-form-id' }} />
        <Button variant="plain" onClick={handleViewYaml} aria-label="View YAML">
          <CodeIcon /> View YAML
        </Button>
      </div>

      <FormFieldGroupExpandable
        toggleAriaLabel="Details"
        header={
          <FormFieldGroupHeader
            titleText={{ text: 'Knowledge Description', id: 'knowledge-description' }}
            titleDescription="What is InstructLab Knowledge?"
          />
        }
      >
        <KnowledgeDescription />
      </FormFieldGroupExpandable>

      <FormFieldGroupExpandable
        isExpanded
        toggleAriaLabel="Details"
        header={
          <FormFieldGroupHeader
            titleText={{ text: 'Author Info', id: 'author-info-id' }}
            titleDescription="Provide your information required for a GitHub DCO sign-off."
          />
        }
      >
        <FormGroup isRequired key={'author-info-details-id'}>
          <TextInput
            isRequired
            type="email"
            aria-label="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(_event, value) => setEmail(value)}
          />
          <TextInput
            isRequired
            type="text"
            aria-label="name"
            placeholder="Enter your full name"
            value={name}
            onChange={(_event, value) => setName(value)}
          />
        </FormGroup>
      </FormFieldGroupExpandable>
      <FormFieldGroupExpandable
        isExpanded
        toggleAriaLabel="Details"
        header={
          <FormFieldGroupHeader
            titleText={{ text: 'Knowledge Info', id: 'knowledge-info-id' }}
            titleDescription="Provide brief information about the knowledge."
          />
        }
      >
        <FormGroup key={'knowledge-info-details-id'}>
          <TextInput
            isRequired
            type="text"
            aria-label="submission_summary"
            placeholder="Enter a brief description for a submission summary (60 character max)"
            value={submission_summary}
            onChange={(_event, value) => setSubmissionSummary(value)}
            maxLength={60}
          />
          <TextInput
            isRequired
            type="text"
            aria-label="domain"
            placeholder="Enter domain information"
            value={domain}
            onChange={(_event, value) => setDomain(value)}
          />
          <TextArea
            isRequired
            type="text"
            aria-label="task_description"
            placeholder="Enter a detailed description to improve the teacher model's responses"
            value={task_description}
            onChange={(_event, value) => setTaskDescription(value)}
          />
        </FormGroup>
      </FormFieldGroupExpandable>

      <FormFieldGroupExpandable
        toggleAriaLabel="Details"
        header={
          <FormFieldGroupHeader
            titleText={{ text: 'Knowledge', id: 'contrib-knowledge-id' }}
            titleDescription="Contribute knowledge to the taxonomy repository (shift+enter for a new line)."
          />
        }
      >
        {questions.map((question, index) => (
          <FormGroup key={index}>
            <Text className="heading-k"> Question and Answer: {index + 1}</Text>
            <TextArea
              isRequired
              type="text"
              aria-label={`Question ${index + 1}`}
              placeholder="Enter the question"
              value={questions[index]}
              onChange={(_event, value) => handleInputChange(index, 'question', value)}
            />
            <TextArea
              isRequired
              type="text"
              aria-label={`Answer ${index + 1}`}
              placeholder="Enter the answer"
              value={answers[index]}
              onChange={(_event, value) => handleInputChange(index, 'answer', value)}
            />
            <Button variant="danger" onClick={() => deleteQuestionAnswerPair(index)}>
              <MinusCircleIcon /> Delete
            </Button>
          </FormGroup>
        ))}
        <Button variant="primary" onClick={addQuestionAnswerPair}>
          <PlusIcon /> Add Question and Answer
        </Button>
      </FormFieldGroupExpandable>

      <FormFieldGroupExpandable
        toggleAriaLabel="Details"
        header={
          <FormFieldGroupHeader
            titleText={{ text: 'Knowledge Documents', id: 'doc-info-id' }}
            titleDescription="Add the relevant knowledge documents"
          />
        }
      >
        <FormGroup>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant={useFileUpload ? 'secondary' : 'primary'}
              className={!useFileUpload ? 'button-active' : 'button-secondary'}
              onClick={() => setUseFileUpload(false)}
            >
              Manually Enter Document Details
            </Button>
            <Button
              variant={useFileUpload ? 'primary' : 'secondary'}
              className={useFileUpload ? 'button-active' : 'button-secondary'}
              onClick={() => setUseFileUpload(true)}
            >
              Upload Documents
            </Button>
            {useFileUpload && (
              <Button variant="primary" onClick={() => setIsFileSelectionModalOpen(true)}>
                Select Files from GitHub
              </Button>
            )}
          </div>
        </FormGroup>

        {!useFileUpload ? (
          <FormGroup key={'doc-info-details-id'}>
            <TextInput
              isRequired
              type="url"
              aria-label="repo"
              placeholder="Enter repo url where document exists"
              value={repo}
              onChange={(_event, value) => setRepo(value)}
            />
            <TextInput
              isRequired
              type="text"
              aria-label="commit"
              placeholder="Enter the commit sha of the document in that repo"
              value={commit}
              onChange={(_event, value) => setCommit(value)}
            />
            <TextInput
              isRequired
              type="text"
              aria-label="patterns"
              placeholder="Enter the documents name (comma separated)"
              value={patterns}
              onChange={(_event, value) => setPatterns(value)}
            />
          </FormGroup>
        ) : (
          <>
            <UploadFile onFilesChange={setUploadedFiles} files={uploadedFiles} isConverting={isConverting} conversionMessage={conversionMessage} />
            <Button variant="primary" onClick={handleDocumentUpload}>
              Submit Files
            </Button>
          </>
        )}
      </FormFieldGroupExpandable>

      <FormFieldGroupExpandable
        toggleAriaLabel="Details"
        header={
          <FormFieldGroupHeader
            titleText={{ text: 'Attribution Info', id: 'attribution-info-id' }}
            titleDescription="Provide attribution information."
          />
        }
      >
        <FormGroup isRequired key={'attribution-info-details-id'}>
          <TextInput
            isRequired
            type="text"
            aria-label="title_work"
            placeholder="Enter title of work"
            value={title_work}
            onChange={(_event, value) => setTitleWork(value)}
          />
          <TextInput
            isRequired
            type="url"
            aria-label="link_work"
            placeholder="Enter link to work"
            value={link_work}
            onChange={(_event, value) => setLinkWork(value)}
          />
          <TextInput
            isRequired
            type="text"
            aria-label="revision"
            placeholder="Enter document revision information"
            value={revision}
            onChange={(_event, value) => setRevision(value)}
          />
          <TextInput
            isRequired
            type="text"
            aria-label="license_work"
            placeholder="Enter license of the work"
            value={license_work}
            onChange={(_event, value) => setLicenseWork(value)}
          />
          <TextInput
            isRequired
            type="text"
            aria-label="creators"
            placeholder="Enter creators Name"
            value={creators}
            onChange={(_event, value) => setCreators(value)}
          />
        </FormGroup>
      </FormFieldGroupExpandable>
      {isSuccessAlertVisible && (
        <Alert
          variant="success"
          title={success_alert_title}
          actionClose={<AlertActionCloseButton onClose={onCloseSuccessAlert} />}
          actionLinks={
            <>
              <AlertActionLink component="a" href={successAlertLink} target="_blank" rel="noopener noreferrer">
                View it here
              </AlertActionLink>
            </>
          }
        >
          {success_alert_message}
        </Alert>
      )}
      {isFailureAlertVisible && (
        <Alert variant="danger" title={failure_alert_title} actionClose={<AlertActionCloseButton onClose={onCloseFailureAlert} />}>
          {failure_alert_message}
        </Alert>
      )}

      <ActionGroup>
        <Button variant="primary" type="submit" className="submit-k" onClick={handleSubmit}>
          Submit Knowledge
        </Button>
        <Button variant="primary" type="button" className="download-k-yaml" onClick={handleDownloadYaml}>
          Download YAML
        </Button>
        <Button variant="primary" type="button" className="download-k-attribution" onClick={handleDownloadAttribution}>
          Download Attribution
        </Button>
      </ActionGroup>
    </Form>
  );
};

export default KnowledgeForm;
