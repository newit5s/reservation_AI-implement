const TestCrash = () => {
  throw new Error('Intentional crash for error boundary validation');
};

export default TestCrash;
