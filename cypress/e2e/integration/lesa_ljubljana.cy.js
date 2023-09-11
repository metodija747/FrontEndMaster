describe('User Flows', () => {
  let token; // We'll store the token here for reuse

  beforeEach(() => {
    cy.visit('http://metodija747.s3-website-us-east-1.amazonaws.com/');
  });

  it('should successfully sign up a new user', () => {

    // Open the sign-up dialog
    cy.get('.auth-button').contains('Sign Up').click();

    // Fill in the form fields
    cy.get('input[placeholder="Email"]').type('newuser@example.com');
    cy.get('input[placeholder="Password"]').type('FIfa12345%');
    cy.get('input[placeholder="Repeat your password"]').type('FIfa12345%');

    // Submit the form
    cy.get('.btn-primary').contains('Sign Up').click();

    // Wait for the snackbar to appear
    cy.contains('Signed up successfully', { timeout: 10000 }).should('exist'); // 10-second timeout
  });

  it('should successfully sign in an existing user', () => {
    // Open the sign-in dialog
    cy.get('.auth-button').contains('Sign In').click();

    // Fill in the email and password
    cy.get('input[placeholder="Email"]').type('newuser@example.com');
    cy.get('input[placeholder="Password"]').type('FIfa12345%');

    // Click the Sign In button
    cy.get('.btn-primary').contains('Sign In').click();

    // Wait for the snackbar to appear
    cy.contains('Signed in successfully', { timeout: 10000 }).should('exist'); // 10-second timeout

    // Store the idToken in `token` for later use
    cy.window().then((window) => {
      token = window.localStorage.getItem('idToken');
      expect(token).to.exist;
    });
  });

  describe('Add to Cart Flow', () => {

    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.setItem('idToken', token);
      });
      // Revisit the page after setting the token
      cy.visit('http://metodija747.s3-website-us-east-1.amazonaws.com/');
    });

    it('should add the first product to cart', () => {
      // Check the catalog exists
      cy.get('.container').should('exist');

      // Click the 'Add to Cart' button for the first product in the list
      cy.get(':nth-child(2) > app-product-card > .card > .card-body > .row > .border-sm-start-none > .flex-column > .btn-outline-dark > span').click();

      // Verify the snackbar message
      cy.contains('Product added to cart successfully', { timeout: 10000 }).should('exist');
    });

      it('should navigate to product details and add to cart, add comment and rating and delete it', () => {

      //  Navigate to the product detail of the second item in the catalog
      cy.get(':nth-child(3) > app-product-card > .card > .card-body > .row > .border-sm-start-none > .flex-column > [style="background-color: #8b4513; color: #fff;"]')
      .eq(0) // get the first element that matches
      .click();

      // Step 2: Wait for the product detail page to load (you can adjust this based on how your site behaves)
      cy.contains('Wood Ring Necklace', { timeout: 10000 }).should('exist');

      // Step 3: Locate and click the 'Add to Cart' button within the modal
      cy.get('.btn.btn-outline-dark.btn-sm.mt-2.spinner-button.mr-2', { timeout: 10000 })
        .should('exist')
        .click();

      // Step 4: Verify the snackbar message
      cy.contains('Product added to cart successfully', { timeout: 10000 }).should('exist');

      // Step 1: Click the "Show comments" button
      cy.get('.toggle-button').click();

      // Step 2: Insert a Comment
      cy.get('textarea[name="commentText"]').type('This is a Cypress comment');

      // Step 3: Insert a Rating of 5
      cy.get('.d-inline-flex')
      .find('.ng-star-inserted')
      .filter('[style*="cursor: pointer"]') // This will match elements that CONTAIN "cursor: pointer" in the style
      .eq(4)
      .click();

      // Step 4: Click the Submit button
      cy.get('button[type="submit"]').click();

      // Step 5: Assert that comment and rating are added successfully
      cy.contains('Comment added successfully', { timeout: 10000 }).should('exist');  // Assuming snackBar's text appears on DOM

      // Step 6: Delete the comment
      cy.get('.delete-button').click();

      // // Step 7: Assert that the comment and rating are deleted successfully
      cy.contains('Comment deleted successfully', { timeout: 10000 }).should('exist');

      cy.contains('button', 'Cancel').click();
    });

    it('should update the quantity, assert the price, and delete the first product in the cart', () => {
      // Step 1: Navigate to the cart
      cy.get('.cart-button').trigger('mouseenter');
      cy.get('.cart-dropdown button')
      .contains('View my Cart')  // Filter by the text on the button
      .click();

      // Step 2: Find the product and click the "+" button to update quantity
      cy.get('.col-lg-4.col-md-6.mb-4.mb-lg-0', { timeout: 10000 }).first().within(() => {
        cy.get('button.btn.btn-primary.px-2.ms-2').click();
      });

      cy.get('.price-container span', { timeout: 10000 }).should('contain', '199.98 €');

      // Navigate to the first item in the cart and click the delete button to remove it
      cy.get('.col-lg-5.col-md-6.mb-4.mb-lg-0').first().within(() => {
        cy.get('button.btn.btn-danger').click();
      });

      // Step 5: Assert that the product was successfully deleted
      cy.contains('Product deleted from cart successfully', { timeout: 10000 })
        .should('exist');

      // Locate the CHECKOUT button within the specific column and card and click it
      cy.get('div.col-md-4.custom-class').within(() => {
        cy.get('button.btn.btn-outline-primary:visible')
          .should('not.be.disabled')
          .click();
        });

      // Filling out the form based on your specific HTML layout
      cy.get('div.col-md-9').within(() => {
        cy.get('input#email.form-control.input-custom')
          .type('test@email.com');

        cy.get('input#name.form-control.input-custom')
          .type('John');

        cy.get('input#surname.form-control.input-custom')
          .type('Doe');

        cy.get('input#address.form-control.input-custom')
          .type('123 Main St');

        cy.get('input#telNumber.form-control.input-custom')
          .type('123456789'); // Must match the pattern specified in your validation
        });
        // Clicking the PAY button. Assuming it will be enabled after filling the form.
        cy.get('div.col-md-9').within(() => {
          cy.get('button[type="submit"].btn.btn-primary.btn-rounded:not([disabled])')
            .click();
        });
        cy.wait(7000);
      });
        it('should click on My Orders, assert texts, and then click Close', () => {
          // Navigate to the profile dropdown and click to open it
          cy.get('button#dropdownMenuButton').click();

          // Click on 'My Orders' within the dropdown
          cy.get('button.dropdown-item:contains("My Orders")').click();

        // Wait for the dialog to open, then assert the texts with a timeout of 10 seconds
          cy.contains('John Doe', { timeout: 10000 }).should('exist');
          cy.contains('test@email.com', { timeout: 10000 }).should('exist');
          cy.contains('123 Main St', { timeout: 10000 }).should('exist');

          // Finally, click on the "Close" button to close the dialog
          cy.get('div.cancel-button-container').within(() => {
            cy.get('button.btn.btn-secondary.btn-lg.btn-block')
              .contains('Cancel')
              .click();
          });
        });

        it('should delete the user account', () => {

          // Step 1: Open the Profile Dropdown
          cy.get('.btn.btn-outline-primary.auth-button', { timeout: 10000 })
            .contains('My Profile')
            .click();

          // Step 2: Click on the "Delete my account" option
          cy.get('button.dropdown-item.text-danger', { timeout: 10000 })
            .contains('Delete my account')
            .click();

          // Step 4: Enter the username (email) for the account to be deleted
          cy.get('input#email')
            .type('newuser@example.com');

          // Step 5: Click on the Delete button
          cy.get('button.btn.btn-primary.btn-lg.btn-block')
            .click();

          // Step 5: Assert that the "Sign In" button appears, which means that the account is deleted and the user is logged out
          cy.contains('Sign In', { timeout: 10000 }).should('exist');
        });
      });  // <-- This one was missing
    });
