// Mock API service for AI component generation
// In a real application, this would connect to an actual AI service

export const aiComponentService = {
  async generateFromDescription(description) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simple keyword-based component generation for demo
    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes('card') || lowerDesc.includes('panel')) {
      return {
        name: 'AICard',
        jsx: `<div className="ai-card">
  <div className="card-header">
    <h3>{title || 'Card Title'}</h3>
  </div>
  <div className="card-body">
    <p>{content || 'Card content goes here'}</p>
  </div>
  <div className="card-footer">
    <button className="btn-primary">{buttonText || 'Action'}</button>
  </div>
</div>`,
        css: `.ai-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 16px;
  border: 1px solid #e1e5e9;
  max-width: 400px;
}
.ai-card .card-header h3 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}
.ai-card .card-body p {
  margin: 0 0 16px 0;
  color: #666;
  line-height: 1.5;
}
.ai-card .card-footer .btn-primary {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}
.ai-card .card-footer .btn-primary:hover {
  background: #0056b3;
}`,
        props: ['title', 'content', 'buttonText']
      };
    }
    
    if (lowerDesc.includes('form') || lowerDesc.includes('input')) {
      return {
        name: 'AIForm',
        jsx: `<form className="ai-form">
  <div className="form-group">
    <label>{labelText || 'Label'}</label>
    <input type="text" placeholder={placeholder || 'Enter text'} />
  </div>
  <div className="form-actions">
    <button type="submit" className="btn-submit">{submitText || 'Submit'}</button>
    <button type="button" className="btn-cancel">{cancelText || 'Cancel'}</button>
  </div>
</form>`,
        css: `.ai-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.ai-form .form-group {
  margin-bottom: 16px;
}
.ai-form .form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  color: #333;
  font-size: 14px;
}
.ai-form .form-group input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}
.ai-form .form-group input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
}
.ai-form .form-actions {
  display: flex;
  gap: 8px;
}
.ai-form .btn-submit {
  background: #28a745;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  flex: 1;
  transition: background 0.2s;
}
.ai-form .btn-submit:hover {
  background: #1e7e34;
}
.ai-form .btn-cancel {
  background: #6c757d;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  flex: 1;
  transition: background 0.2s;
}
.ai-form .btn-cancel:hover {
  background: #545b62;
}`,
        props: ['labelText', 'placeholder', 'submitText', 'cancelText']
      };
    }
    
    if (lowerDesc.includes('hero') || lowerDesc.includes('banner')) {
      return {
        name: 'AIHero',
        jsx: `<section className="ai-hero">
  <div className="hero-content">
    <h1>{title || 'Hero Title'}</h1>
    <p>{subtitle || 'Hero subtitle or description goes here'}</p>
    <div className="hero-actions">
      <button className="btn-primary">{primaryAction || 'Get Started'}</button>
      <button className="btn-secondary">{secondaryAction || 'Learn More'}</button>
    </div>
  </div>
</section>`,
        css: `.ai-hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 80px 20px;
  text-align: center;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ai-hero .hero-content h1 {
  font-size: 3rem;
  font-weight: 700;
  margin: 0 0 16px 0;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}
.ai-hero .hero-content p {
  font-size: 1.2rem;
  margin: 0 0 32px 0;
  opacity: 0.9;
  max-width: 600px;
}
.ai-hero .hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}
.ai-hero .btn-primary {
  background: rgba(255,255,255,0.2);
  color: white;
  border: 2px solid white;
  padding: 12px 32px;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
  backdrop-filter: blur(10px);
}
.ai-hero .btn-primary:hover {
  background: white;
  color: #667eea;
}
.ai-hero .btn-secondary {
  background: transparent;
  color: white;
  border: 2px solid rgba(255,255,255,0.5);
  padding: 12px 32px;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}
.ai-hero .btn-secondary:hover {
  border-color: white;
  background: rgba(255,255,255,0.1);
}`,
        props: ['title', 'subtitle', 'primaryAction', 'secondaryAction']
      };
    }
    
    // Default component
    return {
      name: 'AIComponent',
      jsx: `<div className="ai-component">
  <div className="component-header">
    <h4>{title || 'AI Generated Component'}</h4>
  </div>
  <div className="component-body">
    <p>{description || 'This component was generated by AI based on your description.'}</p>
    <button className="component-action">{actionText || 'Click Me'}</button>
  </div>
</div>`,
      css: `.ai-component {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f8f9fa;
  max-width: 400px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
.ai-component .component-header h4 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}
.ai-component .component-body p {
  margin: 0 0 16px 0;
  color: #666;
  line-height: 1.5;
}
.ai-component .component-action {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}
.ai-component .component-action:hover {
  background: #0056b3;
}`,
      props: ['title', 'description', 'actionText']
    };
  },

  async generateFromImage(imageFile) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // For demo purposes, generate a component based on the image name/type
    const fileName = imageFile.name.toLowerCase();
    
    if (fileName.includes('card') || fileName.includes('profile')) {
      return {
        name: 'AIImageCard',
        jsx: `<div className="ai-image-card">
  <div className="image-container">
    <img src={imageUrl || '/placeholder.jpg'} alt={altText || 'Card image'} />
  </div>
  <div className="card-content">
    <h3>{title || 'Image Card Title'}</h3>
    <p>{description || 'Description of the image card content.'}</p>
  </div>
</div>`,
        css: `.ai-image-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  max-width: 300px;
  transition: transform 0.2s;
}
.ai-image-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}
.ai-image-card .image-container {
  width: 100%;
  height: 200px;
  overflow: hidden;
}
.ai-image-card .image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.ai-image-card .card-content {
  padding: 16px;
}
.ai-image-card .card-content h3 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}
.ai-image-card .card-content p {
  margin: 0;
  color: #666;
  line-height: 1.5;
  font-size: 14px;
}`,
        props: ['imageUrl', 'altText', 'title', 'description']
      };
    }
    
    // Default image-based component
    return {
      name: 'AIImageComponent',
      jsx: `<div className="ai-image-component">
  <div className="image-wrapper">
    <img src={imageUrl || '/placeholder.jpg'} alt={altText || 'AI generated from image'} />
  </div>
  <div className="image-caption">
    <h4>{caption || 'AI Generated Component'}</h4>
    <p>{description || 'This component was created by analyzing your uploaded image.'}</p>
  </div>
</div>`,
      css: `.ai-image-component {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  max-width: 400px;
}
.ai-image-component .image-wrapper {
  width: 100%;
  margin-bottom: 16px;
}
.ai-image-component .image-wrapper img {
  width: 100%;
  height: auto;
  max-height: 200px;
  object-fit: cover;
  border-radius: 6px;
}
.ai-image-component .image-caption h4 {
  margin: 0 0 8px 0;
  color: #333;
  text-align: center;
  font-size: 18px;
  font-weight: 600;
}
.ai-image-component .image-caption p {
  margin: 0;
  color: #666;
  text-align: center;
  font-size: 14px;
  line-height: 1.5;
}`,
      props: ['imageUrl', 'altText', 'caption', 'description']
    };
  }
};

export default aiComponentService;
