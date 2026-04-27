export function markdownToSlack(markdown: string) {
  if(!markdown) {
    return ""
  }
  // Convert normal markdown to Slack markdown
  // https://api.slack.com/reference/surfaces/formatting

  // Use unique placeholder tokens to prevent regex conflicts
  const BOLD_PLACEHOLDER = "___BOLD_PLACEHOLDER___";
  const ITALIC_PLACEHOLDER = "___ITALIC_PLACEHOLDER___";
  const LINK_PLACEHOLDER = "___LINK_PLACEHOLDER___";
  const BULLET_PLACEHOLDER = "___BULLET_PLACEHOLDER___";
  const HEADER_PLACEHOLDER = "___HEADER_PLACEHOLDER___";
  
  // Store transformations
  const boldMatches = [];
  const italicMatches = [];
  const linkMatches = [];
  const bulletMatches = [];
  const headerMatches = [];
  
  // Step 1: Replace patterns with placeholders
  
  // Find and store headers
  let modifiedText = markdown.replace(/^(#{1,6})\s+(.*)$/gm, (match, hashes, content) => {
    headerMatches.push(content);
    return `${HEADER_PLACEHOLDER}${headerMatches.length - 1}`;
  });
  
  // Find and store bullet points
  modifiedText = modifiedText.replace(/^\* (.*)$/gm, (match, content) => {
    bulletMatches.push(content);
    return `${BULLET_PLACEHOLDER}${bulletMatches.length - 1}`;
  });
  
  // Find and store links - do this before bold/italic to handle nested cases
  modifiedText = modifiedText.replace(/\[(.*?)\]\((.*?)\)/g, (match, text, url) => {
    linkMatches.push({ text, url });
    return `${LINK_PLACEHOLDER}${linkMatches.length - 1}`;
  });
  
  // Find and store bold text
  modifiedText = modifiedText.replace(/\*\*(.*?)\*\*/g, (match, content) => {
    boldMatches.push(content);
    return `${BOLD_PLACEHOLDER}${boldMatches.length - 1}`;
  });
  
  // Find and store italic text - must do this after bold
  modifiedText = modifiedText.replace(/\*(.*?)\*/g, (match, content) => {
    italicMatches.push(content);
    return `${ITALIC_PLACEHOLDER}${italicMatches.length - 1}`;
  });
  
  // Step 2: Replace placeholders with final formats
  
  // Replace link placeholders first (to handle nested elements)
  for (let i = 0; i < linkMatches.length; i++) {
    const { text, url } = linkMatches[i];
    // Replace in all other stored matches
    for (let j = 0; j < boldMatches.length; j++) {
      boldMatches[j] = boldMatches[j].replace(
        `${LINK_PLACEHOLDER}${i}`, 
        `<${url}|${text}>`
      );
    }
    for (let j = 0; j < italicMatches.length; j++) {
      italicMatches[j] = italicMatches[j].replace(
        `${LINK_PLACEHOLDER}${i}`, 
        `<${url}|${text}>`
      );
    }
    for (let j = 0; j < headerMatches.length; j++) {
      headerMatches[j] = headerMatches[j].replace(
        `${LINK_PLACEHOLDER}${i}`, 
        `<${url}|${text}>`
      );
    }
    // Replace in main text
    modifiedText = modifiedText.replace(
      `${LINK_PLACEHOLDER}${i}`, 
      `<${url}|${text}>`
    );
  }
  
  // Replace header placeholders
  modifiedText = modifiedText.replace(new RegExp(`${HEADER_PLACEHOLDER}(\\d+)`, 'g'), (match, index) => {
    return `*${headerMatches[parseInt(index)]}*`;
  });
  
  // Replace bullet placeholders
  modifiedText = modifiedText.replace(new RegExp(`${BULLET_PLACEHOLDER}(\\d+)`, 'g'), (match, index) => {
    return `- ${bulletMatches[parseInt(index)]}`;
  });
  
  // Replace bold placeholders
  modifiedText = modifiedText.replace(new RegExp(`${BOLD_PLACEHOLDER}(\\d+)`, 'g'), (match, index) => {
    return `*${boldMatches[parseInt(index)]}*`;
  });
  
  // Replace italic placeholders
  modifiedText = modifiedText.replace(new RegExp(`${ITALIC_PLACEHOLDER}(\\d+)`, 'g'), (match, index) => {
    return `_${italicMatches[parseInt(index)]}_`;
  });
  
  return modifiedText;
}
