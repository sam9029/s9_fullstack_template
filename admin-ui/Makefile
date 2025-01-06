HUBDOMAIN=registry.cn-beijing.aliyuncs.com/yoboo
DSPDOMAIN=$(HUBDOMAIN)/koc
TAG := $(shell /bin/date "+%s")
DSPTESTIMAGE=$(DSPDOMAIN):test
DSPIMAGE=$(DSPDOMAIN):latest
STAGEIMAGE=$(DSPDOMAIN):stage

define buildFunction
	npm install --registry=https://registry.npmmirror.com --force
	npm run $(2)
	npm run upload-cdn
	docker build -t $(1) .
	docker push $(1)
endef

define StageFunction
	docker build -f $(2) -t $(1) .
	docker push $(1)
endef

release:
	$(call buildFunction, $(DSPIMAGE), build:prod)

release-test:
	$(call buildFunction, $(DSPTESTIMAGE), build:stage)

stage:
	$(call StageFunction, $(STAGEIMAGE), ./DockerfileTest)

