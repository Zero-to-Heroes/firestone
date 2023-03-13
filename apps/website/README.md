nx build website --prod && aws s3 cp ./dist/apps/website/ s3://www.firestoneapp.gg --recursive --acl public-read
nx build website --prod \
    && aws s3 cp ./dist/apps/website/ s3://www.firestoneapp.gg --recursive --exclude "*" --include "*.js" --content-type text/javascript --acl public-read \
    && aws s3 cp ./dist/apps/website/ s3://www.firestoneapp.gg --recursive --exclude "*" --include "*.html" --acl public-read
