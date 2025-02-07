import React from 'react';
import { EmailSetupProps } from './types';

export const handleEmailSetup = (app: any, setMessages: any, username: string | null) => {
  const emailView = {
    type: 'question',
    question: {
      title: 'Email Support Setup',
      description: 'Would you like to set up email support? This allows us to keep you updated on important information and support requests.',
      color: 'green.400',
      fields: [
        {
          name: 'Current Status',
          value: 'No email address registered'
        }
      ],
      options: [
        {
          label: 'Yes, set up email',
          customId: 'setup_email',
          style: 3
        },
        {
          label: 'Skip for now',
          customId: 'skip_email',
          style: 1
        }
      ],
      footer: {
        text: 'Your privacy is important to us',
        iconURL: 'https://pioneers.dev/coins/keepkey.png'
      },
      app: {
        ...app,
        pioneer: app.pioneer,
        setMessages,
        handleInquiryOptionClick: handleEmailInquiry
      }
    }
  };

  setMessages((prevMessages: any) => [...prevMessages, 
    {
      type: 'message',
      from: 'computer',
      text: 'I notice you haven\'t set up email support yet. Let me help you with that.'
    },
    { type: 'view', view: emailView }
  ]);
};

export const handleEmailInquiry = async (option: string, app: any, setMessages: any, username: string | null) => {
  switch(option) {
    case 'setup_email':
      const emailInputView = {
        type: 'question',
        question: {
          title: 'Enter Email Address',
          description: 'Please enter your email address for support communications.',
          color: 'blue.400',
          fields: [
            {
              name: 'Email',
              type: 'email',
              placeholder: 'your@email.com',
              required: true
            }
          ],
          options: [
            {
              label: 'Submit',
              customId: 'submit_email',
              style: 3
            },
            {
              label: 'Cancel',
              customId: 'cancel_email',
              style: 1
            }
          ],
          footer: {
            text: 'Your email will be used only for support purposes',
            iconURL: 'https://pioneers.dev/coins/keepkey.png'
          },
          app: {
            ...app,
            pioneer: app.pioneer,
            setMessages,
            handleInquiryOptionClick: handleEmailInquiry
          }
        }
      };

      setMessages((prevMessages: any) => {
        const filteredMessages = prevMessages.filter((msg: any) =>
          !(msg.type === 'view' && msg.view?.question?.title === 'Email Support Setup')
        );
        return [...filteredMessages,
          {
            type: 'message',
            from: 'computer',
            text: 'Please enter your email address below:'
          },
          { type: 'view', view: emailInputView }
        ];
      });
      break;

    case 'submit_email':
      const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
      if (emailInput) {
        const email = emailInput.value.trim();
        if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          try {
            if(!username) throw new Error("Username is required");
            const ticketNumber = localStorage.getItem('myRoomId');

            if (!ticketNumber) {
              throw new Error("TicketNumber missing");
            }

            const response = await app.pioneer.CreateEmail({
              username,
              email,
              ticketNumber
            });

            if (response?.data?.success) {
              setMessages((prevMessages: any) => {
                const filteredMessages = prevMessages.filter((msg: any) => 
                  !(msg.type === 'view' && msg.view?.question?.title === 'Enter Email Address')
                );
                return [...filteredMessages, 
                  {
                    type: 'message',
                    from: 'computer',
                    text: `Great! Your email ${email} has been set up successfully. You'll receive support updates at this address.`
                  }
                ];
              });
            } else {
              setMessages((prevMessages: any) => [...prevMessages, 
                {
                  type: 'message',
                  from: 'computer',
                  text: 'There was an error registering your email. Please try again or contact support.'
                }
              ]);
            }
          } catch (e: any) {
            const errorMessage = e.message === "Username or ticketNumber missing" 
              ? "Sorry, we couldn't verify your account details. Please try again later."
              : "Sorry, there was an error setting up your email. Please try again later.";
            
            setMessages((prevMessages: any) => [...prevMessages, 
              {
                type: 'message',
                from: 'computer',
                text: errorMessage
              }
            ]);
          }
        } else {
          // Show invalid email error
          setMessages((prevMessages: any) => {
            const filteredMessages = prevMessages.filter((msg: any) => 
              !(msg.type === 'view' && msg.view?.question?.title === 'Enter Email Address')
            );
            return [...filteredMessages, 
              {
                type: 'message',
                from: 'computer',
                text: 'Please enter a valid email address.'
              }
            ];
          });
        }
      }
      break;

    case 'skip_email':
    case 'cancel_email':
      setMessages((prevMessages: any) => {
        const filteredMessages = prevMessages.filter((msg: any) => 
          !(msg.type === 'view' && 
            (msg.view?.question?.title === 'Email Support Setup' || 
             msg.view?.question?.title === 'Enter Email Address'))
        );
        return [...filteredMessages, 
          {
            type: 'message',
            from: 'computer',
            text: 'Email setup cancelled. You can always set up email support later if you change your mind.'
          }
        ];
      });
      break;
  }
}; 