import sys
from PIL import Image

def resize_image(image_path):
    # Open the image
    image = Image.open(image_path)

    # Resize the image to 250 x 250 pixels
    resized_image = image.resize((250, 250))

    # Get the original file name
    file_name = image_path.split('/')[-1]

    # Create the new file name with the suffix _thumbnail
    new_file_name = file_name.split('.')[0] + '_thumbnail.' + file_name.split('.')[1]

    # Save the resized image with the new file name
    resized_image.save(new_file_name)

    # Print the name of the new file
    print(new_file_name)

if __name__ == "__main__":
    # Get the image file path from the command line arguments
    image_path = sys.argv[1]

    # Call the resize_image function with the image file path
    resize_image(image_path)
