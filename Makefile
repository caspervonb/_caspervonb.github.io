DEPLOY_REMOTE=origin
DEPLOY_BRANCH=master

SOURCE_BRANCH=source

BUILD_DIR=build

.PHONY: build deploy

node_modules: package.json
	npm install

build: node_modules
	node build.js

deploy: build
	git stash && \
	git checkout $(SOURCE_BRANCH) && \
	git add build --force && \
	git commit -m "Deploy $(shell git rev-parse --verify HEAD)" && \
	git subtree split --branch deploy --prefix $(BUILD_DIR) \
	git checkout $(DEPLOY_BRANCH) && \
	git merge deploy -- squash && \
	git checkout $(SOURCE_BRANCH) && \
	git reset HEAD^ \
